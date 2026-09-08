/**
 * SSLCommerz — cards, bKash, Nagad, Rocket and internet banking, through one
 * hosted page.
 *
 * The flow is: we create a session and get a URL, the shopper pays there, and
 * SSLCommerz sends them back plus posts an IPN. Neither of those returns can be
 * trusted on its own — anyone can POST to a success URL — so nothing is marked
 * paid until the validation API confirms it, and the amount it reports is
 * checked against the order.
 *
 *   SSLCOMMERZ_STORE_ID, SSLCOMMERZ_STORE_PASSWORD
 *   SSLCOMMERZ_SANDBOX=1 while testing
 */
import { env } from '$env/dynamic/private';
import { SHOP } from '$lib/paths';

const HOSTS = {
	sandbox: 'https://sandbox.sslcommerz.com',
	live: 'https://securepay.sslcommerz.com'
};

const host = () => (env.SSLCOMMERZ_SANDBOX === '1' ? HOSTS.sandbox : HOSTS.live);

export const paymentConfigured = () => !!(env.SSLCOMMERZ_STORE_ID && env.SSLCOMMERZ_STORE_PASSWORD);

export const isSandbox = () => env.SSLCOMMERZ_SANDBOX === '1';

/** Taka, to two places — the gateway wants major units as a string. */
const taka = (poisha: number) => (poisha / 100).toFixed(2);

export type SessionInput = {
	orderId: string;
	orderNumber: string;
	total: number;
	name: string;
	phone: string;
	email?: string | null;
	address: { line: string; city: string; area?: string; postcode?: string };
	items: { title: string; unitPrice: number; qty: number }[];
	origin: string;
};

/**
 * Creates a payment session. Returns the URL to send the shopper to, or an
 * error to show them — never throws, so a gateway outage shows a message
 * rather than losing the order.
 */
export async function createSession(
	input: SessionInput
): Promise<{ url: string } | { error: string }> {
	if (!paymentConfigured()) return { error: 'Online payment is not set up yet.' };

	const back = (path: string) =>
		`${input.origin}${SHOP}/checkout/payment/${path}/${input.orderNumber}`;

	const body = new URLSearchParams({
		store_id: env.SSLCOMMERZ_STORE_ID!,
		store_passwd: env.SSLCOMMERZ_STORE_PASSWORD!,
		total_amount: taka(input.total),
		currency: 'BDT',
		// The order number, which is unique and readable in the gateway's own
		// reports — a uuid there helps nobody reconciling by hand.
		tran_id: input.orderNumber,
		success_url: back('success'),
		fail_url: back('failed'),
		cancel_url: back('cancelled'),
		ipn_url: `${input.origin}/api/payments/sslcommerz/ipn`,
		cus_name: input.name,
		cus_email: input.email || 'noreply@example.com',
		cus_phone: input.phone,
		cus_add1: input.address.line,
		cus_city: input.address.city,
		cus_country: 'Bangladesh',
		ship_name: input.name,
		ship_add1: input.address.line,
		ship_city: input.address.city,
		ship_state: input.address.city,
		// The v4 docs list every ship_* field as optional. The gateway rejects
		// the session without ship_name and ship_postcode — found by posting to
		// the sandbox, not by reading. We do not collect postcodes (nobody here
		// uses them for delivery), so a placeholder goes in the field the
		// gateway insists on rather than a made-up address.
		ship_postcode: input.address.postcode || '1000',
		ship_country: 'Bangladesh',
		shipping_method: 'Courier',
		product_name: input.items[0]?.title ?? 'Order',
		product_category: 'general',
		product_profile: 'general',
		// Carried through the gateway and handed back, so an IPN can be tied to
		// the order without trusting the transaction id alone.
		value_a: input.orderId,
		cart: JSON.stringify(
			input.items.map((i) => ({ product: i.title, amount: taka(i.unitPrice * i.qty) }))
		)
	});

	try {
		const res = await fetch(`${host()}/gwprocess/v4/api.php`, {
			method: 'POST',
			headers: { 'content-type': 'application/x-www-form-urlencoded' },
			body
		});
		const data = (await res.json()) as Record<string, any>;

		if (data?.status !== 'SUCCESS' || !data?.GatewayPageURL)
			return { error: data?.failedreason || 'The payment gateway refused to start a session.' };

		return { url: String(data.GatewayPageURL) };
	} catch (e) {
		return { error: (e as Error).message };
	}
}

export type Validation = {
	ok: boolean;
	/** Taka as reported by the gateway, in poisha. */
	amount: number;
	transactionId: string;
	cardType?: string;
	reason?: string;
};

/**
 * Asks SSLCommerz whether a payment really happened. This is the only thing
 * that may mark an order paid — the redirect and the IPN are both just
 * prompts to come and ask.
 */
export async function validatePayment(valId: string): Promise<Validation> {
	if (!paymentConfigured())
		return { ok: false, amount: 0, transactionId: '', reason: 'Not set up' };

	const url = new URL(`${host()}/validator/api/validationserverAPI.php`);
	url.searchParams.set('val_id', valId);
	url.searchParams.set('store_id', env.SSLCOMMERZ_STORE_ID!);
	url.searchParams.set('store_passwd', env.SSLCOMMERZ_STORE_PASSWORD!);
	url.searchParams.set('format', 'json');

	try {
		const res = await fetch(url);
		const data = (await res.json()) as Record<string, any>;

		// VALIDATED means we have asked before; both are successful payments.
		const ok = data?.status === 'VALID' || data?.status === 'VALIDATED';
		return {
			ok,
			amount: Math.round(Number(data?.amount ?? 0) * 100),
			transactionId: String(data?.tran_id ?? ''),
			cardType: data?.card_type ? String(data.card_type) : undefined,
			reason: ok ? undefined : String(data?.status ?? 'Unknown status')
		};
	} catch (e) {
		return { ok: false, amount: 0, transactionId: '', reason: (e as Error).message };
	}
}
