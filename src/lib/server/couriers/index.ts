/**
 * Courier adapters. Same contract as the inbox channels: a courier with no
 * credentials says so rather than failing at dispatch time.
 *
 * Steadfast's request shape comes from its published integration package —
 * invoice / recipient_name / recipient_phone / recipient_address / cod_amount /
 * note, authenticated with Api-Key and Secret-Key headers.
 *
 * Pathao is deliberately absent. Its payload has not been verified here, and a
 * guessed field name fails at the worst possible moment: with a real parcel and
 * a real customer waiting.
 */
import { env } from '$env/dynamic/private';

export type CourierKey = 'steadfast';

export type DispatchInput = {
	invoice: string;
	name: string;
	phone: string;
	address: string;
	/** Poisha to collect on delivery. Zero for an order already paid online. */
	codAmount: number;
	note?: string | null;
};

export type DispatchResult = { consignmentId: string; trackingCode: string | null };

export type CourierAdapter = {
	key: CourierKey;
	label: string;
	configured: () => boolean;
	dispatch: (order: DispatchInput) => Promise<DispatchResult>;
	/** The courier's own status wording, or null when it has nothing yet. */
	status: (consignmentId: string) => Promise<string | null>;
};

const STEADFAST_BASE = 'https://portal.packzy.com/api/v1';

async function steadfastFetch(path: string, init?: RequestInit) {
	const res = await fetch(`${env.STEADFAST_BASE_URL || STEADFAST_BASE}${path}`, {
		...init,
		headers: {
			'Api-Key': env.STEADFAST_API_KEY ?? '',
			'Secret-Key': env.STEADFAST_SECRET_KEY ?? '',
			'content-type': 'application/json',
			accept: 'application/json',
			...(init?.headers ?? {})
		}
	});

	const data = (await res.json().catch(() => ({}))) as Record<string, any>;
	if (!res.ok) throw new Error(data.message ?? `Steadfast refused the request (${res.status}).`);
	return data;
}

const steadfast: CourierAdapter = {
	key: 'steadfast',
	label: 'Steadfast',
	configured: () => !!(env.STEADFAST_API_KEY && env.STEADFAST_SECRET_KEY),

	dispatch: async (order) => {
		if (!steadfast.configured())
			throw new Error('Steadfast is not connected. Add its API key and secret.');

		const data = await steadfastFetch('/create_order', {
			method: 'POST',
			body: JSON.stringify({
				invoice: order.invoice,
				recipient_name: order.name,
				recipient_phone: order.phone,
				recipient_address: order.address,
				// Steadfast works in taka; we store poisha.
				cod_amount: Math.round(order.codAmount / 100),
				note: order.note ?? ''
			})
		});

		const consignment = data.consignment ?? {};
		const consignmentId = String(consignment.consignment_id ?? '');
		if (!consignmentId)
			throw new Error('Steadfast accepted the order but returned no consignment id.');

		return { consignmentId, trackingCode: consignment.tracking_code ?? null };
	},

	status: async (consignmentId) => {
		if (!steadfast.configured()) return null;
		const data = await steadfastFetch(`/status_by_cid/${encodeURIComponent(consignmentId)}`);
		return data.delivery_status ? String(data.delivery_status) : null;
	}
};

export const couriers: Record<CourierKey, CourierAdapter> = { steadfast };

export const courierStatusList = () =>
	Object.values(couriers).map((c) => ({ key: c.key, label: c.label, configured: c.configured() }));

/**
 * Maps a courier's wording onto our pipeline. Anything unrecognised returns
 * null: a courier inventing a new status must not silently move an order.
 */
export function pipelineStatusFor(
	courierStatus: string
): 'shipped' | 'delivered' | 'returned' | null {
	const s = courierStatus.toLowerCase();
	if (s.includes('delivered')) return 'delivered';
	if (s.includes('return') || s.includes('cancel')) return 'returned';
	if (s.includes('transit') || s.includes('picked') || s.includes('hold')) return 'shipped';
	return null;
}
