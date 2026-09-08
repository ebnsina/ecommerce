import { describe, it, expect } from 'vitest';
import { SAFE_INTENTS } from './autoReply';

/* The allowlist is the safety mechanism. If something that needs a person ever
   ends up in it, the shop starts answering refund questions by itself. */
describe('auto-reply intents', () => {
	it('never includes anything needing an order, a price or a decision', () => {
		const forbidden = [
			'order_status',
			'refund',
			'cancel_order',
			'price',
			'stock',
			'complaint',
			'discount'
		];
		for (const intent of forbidden) expect(SAFE_INTENTS).not.toContain(intent);
	});

	it('only covers what the shop settings can answer', () => {
		expect([...SAFE_INTENTS]).toEqual([
			'delivery_charge',
			'delivery_time',
			'payment_methods',
			'cash_on_delivery',
			'return_policy',
			'opening_hours',
			'greeting'
		]);
	});
});
