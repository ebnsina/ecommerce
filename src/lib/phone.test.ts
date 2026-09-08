import { describe, it, expect } from 'vitest';
import { normalizePhone, formatPhone, toInternational } from './phone';

describe('normalizePhone', () => {
	it('accepts every way a customer types their number', () => {
		for (const input of [
			'01712345678',
			'+8801712345678',
			'8801712345678',
			'01712-345678',
			'017 1234 5678'
		])
			expect(normalizePhone(input)).toBe('01712345678');
	});

	it('accepts all live operator prefixes', () => {
		for (const p of ['013', '014', '015', '016', '017', '018', '019'])
			expect(normalizePhone(`${p}12345678`)).toBe(`${p}12345678`);
	});

	it('rejects wrong length, landlines and unknown prefixes', () => {
		expect(normalizePhone('0171234567')).toBeNull(); // 10 digits
		expect(normalizePhone('017123456789')).toBeNull(); // 12 digits
		expect(normalizePhone('02955123456')).toBeNull(); // Dhaka landline
		expect(normalizePhone('01212345678')).toBeNull(); // no 012 operator
		expect(normalizePhone('hello')).toBeNull();
	});

	it('formats for display and for the SMS gateway', () => {
		expect(formatPhone('01712345678')).toBe('01712-345678');
		expect(toInternational('01712345678')).toBe('8801712345678');
	});
});

describe('formatPhone', () => {
	it('groups a plain local number', () => {
		expect(formatPhone('01712345678')).toBe('01712-345678');
	});

	it('leaves an already-formatted number alone rather than dashing it twice', () => {
		expect(formatPhone('09613-800800')).toBe('09613-800800');
	});

	it('leaves a short hotline alone', () => {
		expect(formatPhone('16263')).toBe('16263');
	});
});
