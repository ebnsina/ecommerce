import { describe, it, expect } from 'vitest';
import { slugFromText, slugFromRef } from './messageContext';

describe('slugFromText', () => {
	it('finds a product link inside a sentence', () => {
		expect(slugFromText('Hi! I want to order:\nRice 5kg\nhttps://shop.test/p/pran-rice-5kg')).toBe(
			'pran-rice-5kg'
		);
	});

	it('handles a Bangla slug', () => {
		expect(slugFromText('https://shop.test/p/চাল-৫-কেজি')).toBe('চাল-৫-কেজি');
	});

	it('returns null when there is no product link', () => {
		expect(slugFromText('delivery charge koto?')).toBeNull();
		expect(slugFromText('https://shop.test/cart')).toBeNull();
	});
});

describe('slugFromRef', () => {
	it('accepts a bare slug and a prefixed one', () => {
		expect(slugFromRef('pran-rice-5kg')).toBe('pran-rice-5kg');
		expect(slugFromRef('product:pran-rice-5kg')).toBe('pran-rice-5kg');
	});

	it('accepts a full URL as a referral payload', () => {
		expect(slugFromRef('https://shop.test/p/pran-rice-5kg')).toBe('pran-rice-5kg');
	});

	it('rejects nothing and junk', () => {
		expect(slugFromRef(null)).toBeNull();
		expect(slugFromRef('')).toBeNull();
		expect(slugFromRef('some random ref text')).toBeNull();
	});
});
