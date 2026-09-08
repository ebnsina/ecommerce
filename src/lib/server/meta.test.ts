import { describe, it, expect } from 'vitest';
import { hashEmail, hashPhone, hashName, userData, purchaseEventId } from './meta';

// SHA-256 of "8801712345678" — the international form of a local BD number.
const PHONE_HASH = hashPhone('01712345678');

describe('hashing', () => {
	it('normalises an email before hashing', () => {
		expect(hashEmail('  Owner@Store.TEST ')).toBe(hashEmail('owner@store.test'));
		expect(hashEmail('not-an-email')).toBeNull();
	});

	it('converts a local Bangladeshi number to its international form', () => {
		// All three spellings of the same number must produce one hash, or the
		// same customer matches as three different people.
		expect(hashPhone('01712345678')).toBe(PHONE_HASH);
		expect(hashPhone('+880 1712-345678')).toBe(PHONE_HASH);
		expect(hashPhone('8801712345678')).toBe(PHONE_HASH);
	});

	it('returns null rather than hashing nothing', () => {
		expect(hashPhone('')).toBeNull();
		expect(hashName('   ')).toBeNull();
	});

	it('strips spacing and case from names', () => {
		expect(hashName(' Rahim  Uddin ')).toBe(hashName('rahimuddin'));
	});
});

describe('userData', () => {
	it('sends hashed fields as arrays and omits what is missing', () => {
		const out = userData({ phone: '01712345678', fbp: 'fb.1.2.3' });
		expect(out.ph).toEqual([PHONE_HASH]);
		expect(out.fbp).toBe('fb.1.2.3');
		expect(out.em).toBeUndefined();
		expect(out.fbc).toBeUndefined();
	});

	it('never sends raw personal data', () => {
		const out = JSON.stringify(userData({ email: 'a@b.com', phone: '01712345678' }));
		expect(out).not.toContain('a@b.com');
		expect(out).not.toContain('01712345678');
	});
});

describe('purchaseEventId', () => {
	it('is stable, so the pixel and the server deduplicate', () => {
		expect(purchaseEventId('abc')).toBe(purchaseEventId('abc'));
		expect(purchaseEventId('abc')).not.toBe(purchaseEventId('def'));
	});
});
