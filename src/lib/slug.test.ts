import { describe, it, expect } from 'vitest';
import { slugify, uniqueSlug } from './slug';

describe('slugify', () => {
	it('normalises latin titles', () => {
		expect(slugify('  Philips Air Fryer 3.2L  ')).toBe('philips-air-fryer-3-2l');
		expect(slugify("Men's Café Sneakers")).toBe('mens-cafe-sneakers');
	});

	it('keeps Bengali characters', () => {
		expect(slugify('চাল ও ডাল')).toBe('চাল-ও-ডাল');
	});

	it('never leaves stray separators', () => {
		expect(slugify('!!! ---')).toBe('');
		expect(slugify('a  &  b')).toBe('a-b');
	});
});

describe('uniqueSlug', () => {
	it('passes through when free and suffixes when taken', () => {
		expect(uniqueSlug('rice', new Set())).toBe('rice');
		expect(uniqueSlug('rice', new Set(['rice']))).toBe('rice-2');
		expect(uniqueSlug('rice', new Set(['rice', 'rice-2']))).toBe('rice-3');
		expect(uniqueSlug('', new Set())).toBe('item');
	});
});
