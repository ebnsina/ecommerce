import { describe, it, expect } from 'vitest';
import { formatTk, discountPercent, parseTk } from './money';

describe('money', () => {
	it('formats whole taka without decimals', () => {
		expect(formatTk(469900)).toBe('৳4,699');
		expect(formatTk(4200)).toBe('৳42');
		expect(formatTk(0)).toBe('৳0');
	});

	it('keeps poisha when present', () => {
		expect(formatTk(46950)).toBe('৳469.50');
		expect(formatTk(46905)).toBe('৳469.05');
	});

	it('handles negatives (refunds, discount lines)', () => {
		expect(formatTk(-15000)).toBe('-৳150');
	});

	it('computes discount only when there is a real saving', () => {
		expect(discountPercent(469900, 499900)).toBe(6);
		expect(discountPercent(469900, 469900)).toBe(0);
		expect(discountPercent(469900, null)).toBe(0);
		expect(discountPercent(500000, 400000)).toBe(0);
	});

	it('parses admin input and rejects garbage', () => {
		expect(parseTk('4699')).toBe(469900);
		expect(parseTk('4,699.50')).toBe(469950);
		expect(() => parseTk('4699.999')).toThrow();
		expect(() => parseTk('abc')).toThrow();
	});
});
