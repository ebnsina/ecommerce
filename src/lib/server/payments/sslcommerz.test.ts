import { describe, it, expect, vi, beforeEach } from 'vitest';

/* The gateway wants major units as a string; we store poisha. A ×100 error
   here is a shopper charged a hundred times the order. */
vi.mock('$env/dynamic/private', () => ({
	env: {
		SSLCOMMERZ_STORE_ID: 'testbox',
		SSLCOMMERZ_STORE_PASSWORD: 'qwerty',
		SSLCOMMERZ_SANDBOX: '1'
	}
}));

const { createSession, validatePayment, paymentConfigured } = await import('./sslcommerz');

const order = {
	orderId: 'uuid-1',
	orderNumber: '260908-0001',
	total: 249900,
	name: 'Rahim Uddin',
	phone: '01712345678',
	address: { line: 'Road 12, Banani', city: 'Dhaka' },
	items: [{ title: 'Electric Kettle', unitPrice: 124950, qty: 2 }],
	origin: 'https://shop.test'
};

describe('sslcommerz', () => {
	beforeEach(() => vi.restoreAllMocks());

	it('is configured when both credentials are present', () => {
		expect(paymentConfigured()).toBe(true);
	});

	it('sends taka, not poisha, and the order number as the transaction id', async () => {
		let body: URLSearchParams | undefined;
		vi.stubGlobal(
			'fetch',
			vi.fn(async (_url: string, init: RequestInit) => {
				body = new URLSearchParams(init.body as string);
				return { json: async () => ({ status: 'SUCCESS', GatewayPageURL: 'https://pay.test/x' }) };
			})
		);

		const result = await createSession(order);
		expect(result).toEqual({ url: 'https://pay.test/x' });
		expect(body?.get('total_amount')).toBe('2499.00');
		expect(body?.get('currency')).toBe('BDT');
		expect(body?.get('tran_id')).toBe('260908-0001');
		// The order id rides along so an IPN can be tied back without trusting
		// the transaction id alone.
		expect(body?.get('value_a')).toBe('uuid-1');
		expect(JSON.parse(body?.get('cart') ?? '[]')).toEqual([
			{ product: 'Electric Kettle', amount: '2499.00' }
		]);
	});

	// The published docs call these optional. The live sandbox refuses the
	// session without them, so the test pins what the gateway actually wants.
	it('sends the shipping fields the gateway insists on', async () => {
		let body: URLSearchParams | undefined;
		vi.stubGlobal(
			'fetch',
			vi.fn(async (_url: string, init: RequestInit) => {
				body = new URLSearchParams(init.body as string);
				return { json: async () => ({ status: 'SUCCESS', GatewayPageURL: 'https://pay.test/x' }) };
			})
		);
		await createSession(order);
		expect(body?.get('ship_name')).toBe('Rahim Uddin');
		expect(body?.get('ship_postcode')).toBeTruthy();
		expect(body?.get('ship_country')).toBe('Bangladesh');
	});

	it('returns the gateway’s reason rather than a URL when it refuses', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => ({
				json: async () => ({ status: 'FAILED', failedreason: 'Store inactive' })
			}))
		);
		expect(await createSession(order)).toEqual({ error: 'Store inactive' });
	});

	it('never throws when the gateway is unreachable', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => {
				throw new Error('ECONNREFUSED');
			})
		);
		expect(await createSession(order)).toEqual({ error: 'ECONNREFUSED' });
	});

	it('treats VALID and VALIDATED as paid, and converts the amount back to poisha', async () => {
		for (const status of ['VALID', 'VALIDATED']) {
			vi.stubGlobal(
				'fetch',
				vi.fn(async () => ({
					json: async () => ({ status, amount: '2499.00', tran_id: '260908-0001' })
				}))
			);
			const v = await validatePayment('val-1');
			expect(v.ok).toBe(true);
			expect(v.amount).toBe(249900);
		}
	});

	it('treats anything else as unpaid', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => ({ json: async () => ({ status: 'INVALID_TRANSACTION' }) }))
		);
		const v = await validatePayment('val-1');
		expect(v.ok).toBe(false);
		expect(v.reason).toBe('INVALID_TRANSACTION');
	});
});
