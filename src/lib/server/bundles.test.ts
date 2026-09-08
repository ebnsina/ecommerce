import { describe, it, expect } from 'vitest';
import { allocatePrices } from './bundles';

const member = (unitPrice: number, qty = 1) => ({
	productId: 'p',
	variantId: null,
	qty,
	title: 't',
	slug: 's',
	image: null,
	unitPrice,
	stock: 10
});

describe('allocatePrices', () => {
	it('splits the bundle price in proportion to what each part is worth', () => {
		const items = [member(60000), member(40000)];
		expect(allocatePrices(items, 80000)).toEqual([48000, 32000]);
	});

	it('sums to the bundle price exactly, with no poisha adrift', () => {
		const items = [member(33333), member(33333), member(33334)];
		const prices = allocatePrices(items, 50000);
		expect(prices.reduce((a, b) => a + b, 0)).toBe(50000);
	});

	it('accounts for quantity when a part appears more than once', () => {
		const items = [member(10000, 2), member(10000, 1)];
		const prices = allocatePrices(items, 24000);
		// two units at 8000 plus one at 8000 is the whole 24000
		expect(prices[0] * 2 + prices[1] * 1).toBe(24000);
	});

	it('handles a free bundle and worthless members without dividing by zero', () => {
		expect(allocatePrices([member(0), member(0)], 1000)).toEqual([0, 0]);
		expect(allocatePrices([member(500), member(500)], 0)).toEqual([0, 0]);
	});
});
