/**
 * Bangladeshi mobile numbers. Stored canonically as 01XXXXXXXXX (11 digits) —
 * that is what customers type, what SMS gateways expect, and what staff read out.
 */
const OPERATORS = ['013', '014', '015', '016', '017', '018', '019']; // GP, Robi, Banglalink, Teletalk, Airtel

/** Accepts 01…, 8801…, +8801…, and spaces/dashes. Returns null if it is not one. */
export function normalizePhone(input: string): string | null {
	const digits = input.replace(/[^\d]/g, '');
	const local = digits.startsWith('880')
		? `0${digits.slice(3)}`
		: digits.startsWith('1') && digits.length === 10
			? `0${digits}`
			: digits;

	if (local.length !== 11 || !local.startsWith('0')) return null;
	if (!OPERATORS.includes(local.slice(0, 3))) return null;
	return local;
}

/** 01712345678 -> 01712-345678 */
/**
 * Groups a number for reading. Anything that is not a plain 11-digit local
 * number — a hotline, an already-formatted string, an international form — is
 * handed back untouched, because grouping it again produced things like
 * `09613--800800`.
 */
export const formatPhone = (phone: string) => {
	const digits = phone.replace(/\D/g, '');
	return digits.length === 11 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : phone;
};

/** 01712345678 -> 8801712345678, the form most gateways want. */
export const toInternational = (phone: string) => `88${phone}`;
