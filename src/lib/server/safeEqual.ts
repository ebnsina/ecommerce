import { timingSafeEqual } from 'node:crypto';

/** Compares two secrets without leaking their contents through how long it
    takes. `timingSafeEqual` throws on a length mismatch, hence the pre-check. */
export function safeEqual(a: string, b: string): boolean {
	const x = Buffer.from(a);
	const y = Buffer.from(b);
	return x.length === y.length && timingSafeEqual(x, y);
}
