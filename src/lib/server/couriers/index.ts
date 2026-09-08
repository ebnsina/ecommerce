/**
 * Courier adapters. Same contract as the inbox channels: a courier with no
 * credentials says so rather than failing at dispatch time.
 *
 * Steadfast's request shape comes from its published integration package —
 * invoice / recipient_name / recipient_phone / recipient_address / cod_amount /
 * note, authenticated with Api-Key and Secret-Key headers.
 *
 * Pathao needs numeric ids for city, zone and area rather than a written
 * address, so the adapter resolves them from Pathao's own lists at dispatch
 * time and refuses rather than guessing when a name does not match.
 */
import { env } from '$env/dynamic/private';
import type { JsonBody } from '../json';

export type CourierKey = 'steadfast' | 'pathao';

export type DispatchInput = {
	invoice: string;
	name: string;
	phone: string;
	/** The address as one line, which is all Steadfast wants. */
	address: string;
	/** The parts, for a courier that needs its own ids for them. */
	place: { city: string; area?: string };
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

	const data = (await res.json().catch(() => ({}))) as JsonBody;
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

/* ── Pathao ──────────────────────────────────────────────────────────────
   Two things make Pathao unlike Steadfast: a short-lived OAuth token, and a
   delivery address given as numeric city / zone / area ids from its own
   hierarchy rather than as text. Those ids are looked up by name at dispatch
   time and cached for the process, because they change rarely and fetching
   three lists per parcel would be wasteful. */

const PATHAO_BASE = {
	sandbox: 'https://courier-api-sandbox.pathao.com',
	live: 'https://api-hermes.pathao.com'
};

const pathaoHost = () =>
	env.PATHAO_SANDBOX === '1' ? PATHAO_BASE.sandbox : env.PATHAO_BASE_URL || PATHAO_BASE.live;

let token: { value: string; expiresAt: number } | null = null;

async function pathaoToken(): Promise<string> {
	// A minute of margin, so a token cannot expire between the check and the use.
	if (token && token.expiresAt > Date.now() + 60_000) return token.value;

	const res = await fetch(`${pathaoHost()}/aladdin/api/v1/issue-token`, {
		method: 'POST',
		headers: { 'content-type': 'application/json', accept: 'application/json' },
		body: JSON.stringify({
			client_id: env.PATHAO_CLIENT_ID,
			client_secret: env.PATHAO_CLIENT_SECRET,
			username: env.PATHAO_USERNAME,
			password: env.PATHAO_PASSWORD,
			grant_type: 'password'
		})
	});
	const data = (await res.json().catch(() => ({}))) as JsonBody;
	if (!res.ok || !data.access_token)
		throw new Error(data.message ?? 'Pathao refused the credentials.');

	token = {
		value: String(data.access_token),
		expiresAt: Date.now() + Number(data.expires_in ?? 3600) * 1000
	};
	return token.value;
}

async function pathaoFetch(path: string, init?: RequestInit) {
	const res = await fetch(`${pathaoHost()}${path}`, {
		...init,
		headers: {
			authorization: `Bearer ${await pathaoToken()}`,
			'content-type': 'application/json',
			accept: 'application/json',
			...(init?.headers ?? {})
		}
	});
	const data = (await res.json().catch(() => ({}))) as JsonBody;
	if (!res.ok) throw new Error(data.message ?? `Pathao refused the request (${res.status}).`);
	return data;
}

/** Loose name matching: "Dhaka" against "Dhaka City", either way round. */
const sameName = (a: string, b: string) => {
	const x = a.trim().toLowerCase();
	const y = b.trim().toLowerCase();
	return x === y || x.includes(y) || y.includes(x);
};

const placeCache = new Map<string, JsonBody[]>();

async function pathaoList(path: string, key: string): Promise<JsonBody[]> {
	if (!placeCache.has(key)) {
		const data = await pathaoFetch(path);
		placeCache.set(key, data?.data?.data ?? []);
	}
	return placeCache.get(key)!;
}

/**
 * Turns "Dhaka" / "Banani" into the ids Pathao wants. Throws with a plain
 * message when it cannot, so staff see which part of the address it could not
 * place rather than a rejected parcel.
 */
async function pathaoPlace(city: string, area?: string) {
	const cities = await pathaoList('/aladdin/api/v1/city-list', 'cities');
	const match = cities.find((c) => sameName(String(c.city_name ?? ''), city));
	if (!match) throw new Error(`Pathao does not list a city matching "${city}".`);
	const cityId = Number(match.city_id);

	const zones = await pathaoList(`/aladdin/api/v1/cities/${cityId}/zone-list`, `z${cityId}`);
	// Without an area we cannot pick a zone, and Pathao requires one.
	const zone = area ? zones.find((z) => sameName(String(z.zone_name ?? ''), area)) : undefined;
	if (!zone)
		throw new Error(
			area
				? `Pathao does not list a zone matching "${area}" in ${city}.`
				: `Pathao needs an area inside ${city}; this order has none.`
		);
	const zoneId = Number(zone.zone_id);

	const areas = await pathaoList(`/aladdin/api/v1/zones/${zoneId}/area-list`, `a${zoneId}`);
	// Any area within the right zone delivers; the first is Pathao's own default.
	const areaId = Number(
		(areas.find((a) => sameName(String(a.area_name ?? ''), area ?? '')) ?? areas[0])?.area_id
	);
	if (!areaId) throw new Error(`Pathao lists no areas inside "${zone.zone_name}".`);

	return { cityId, zoneId, areaId };
}

const pathao: CourierAdapter = {
	key: 'pathao',
	label: 'Pathao',
	configured: () =>
		!!(
			env.PATHAO_CLIENT_ID &&
			env.PATHAO_CLIENT_SECRET &&
			env.PATHAO_USERNAME &&
			env.PATHAO_PASSWORD &&
			env.PATHAO_STORE_ID
		),

	dispatch: async (order) => {
		if (!pathao.configured())
			throw new Error('Pathao is not connected. Add its client, user and store details.');

		const place = await pathaoPlace(order.place.city, order.place.area);

		const data = await pathaoFetch('/aladdin/api/v1/orders', {
			method: 'POST',
			body: JSON.stringify({
				store_id: Number(env.PATHAO_STORE_ID),
				merchant_order_id: order.invoice,
				recipient_name: order.name,
				recipient_phone: order.phone,
				recipient_address: order.address,
				recipient_city: place.cityId,
				recipient_zone: place.zoneId,
				recipient_area: place.areaId,
				// 48 is Pathao's normal delivery; 12 is same-day.
				delivery_type: Number(env.PATHAO_DELIVERY_TYPE ?? 48),
				// 2 is a parcel rather than a document.
				item_type: 2,
				item_quantity: 1,
				// Grams. Pathao rejects zero, and half a kilo is its own minimum.
				item_weight: Number(env.PATHAO_ITEM_WEIGHT ?? 0.5),
				// Pathao collects in taka; we store poisha.
				amount_to_collect: Math.round(order.codAmount / 100),
				special_instruction: order.note ?? ''
			})
		});

		const consignmentId = String(data?.data?.consignment_id ?? '');
		if (!consignmentId)
			throw new Error('Pathao accepted the order but returned no consignment id.');
		return { consignmentId, trackingCode: consignmentId };
	},

	status: async (consignmentId) => {
		if (!pathao.configured()) return null;
		const data = await pathaoFetch(
			`/aladdin/api/v1/orders/${encodeURIComponent(consignmentId)}/info`
		);
		const status = data?.data?.order_status ?? data?.data?.delivery_status;
		return status ? String(status) : null;
	}
};

export const couriers: Record<CourierKey, CourierAdapter> = { steadfast, pathao };

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
	// Pathao says Pickup_Requested / Assigned_for_Delivery; Steadfast says
	// in_transit. Matched on words, so neither courier's exact casing matters.
	if (
		s.includes('transit') ||
		s.includes('picked') ||
		s.includes('pickup') ||
		s.includes('delivery') ||
		s.includes('hold')
	)
		return 'shipped';
	return null;
}
