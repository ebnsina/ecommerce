/**
 * Product comparison. The list lives in a cookie, not the database — it is a
 * throwaway shortlist, works for signed-out shoppers, and never needs cleanup.
 */
import type { RequestEvent } from '@sveltejs/kit';

const COOKIE = 'compare';
export const MAX_COMPARE = 4;

const read = (raw: string | undefined) =>
	(raw ?? '')
		.split(',')
		.map((s) => s.trim())
		.filter((s) => /^[0-9a-f-]{36}$/i.test(s));

export const getCompareIds = (event: RequestEvent): string[] =>
	read(event.cookies.get(COOKIE)).slice(0, MAX_COMPARE);

function write(event: RequestEvent, ids: string[]) {
	event.cookies.set(COOKIE, ids.join(','), {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: !import.meta.env.DEV,
		maxAge: 30 * 86400
	});
}

/** Adds or removes, capped. Returns why it refused so the UI can say so. */
export function toggleCompare(
	event: RequestEvent,
	productId: string
): { ok: true; ids: string[]; added: boolean } | { ok: false; error: string } {
	const ids = getCompareIds(event);

	if (ids.includes(productId)) {
		const next = ids.filter((id) => id !== productId);
		write(event, next);
		return { ok: true, ids: next, added: false };
	}

	if (ids.length >= MAX_COMPARE)
		return { ok: false, error: `You can compare ${MAX_COMPARE} products at a time.` };

	const next = [...ids, productId];
	write(event, next);
	return { ok: true, ids: next, added: true };
}

export function removeCompare(event: RequestEvent, productId: string) {
	write(
		event,
		getCompareIds(event).filter((id) => id !== productId)
	);
}

export const clearCompare = (event: RequestEvent) => write(event, []);
