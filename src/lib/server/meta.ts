/**
 * Meta Pixel and Conversions API.
 *
 * The browser pixel alone loses a large share of events to ad blockers and iOS
 * privacy settings, so the same events are also sent server-side. Both carry the
 * same `event_id`, which is how Meta deduplicates them — without it every
 * purchase is counted twice and the ad reporting is worthless.
 *
 * The pixel ID is public and lives in Settings. The access token is a secret and
 * lives in the environment.
 */
import { createHash } from 'node:crypto';
import { env } from '$env/dynamic/private';
import { normalizePhone, toInternational } from '$lib/phone';
import type { JsonBody } from './json';
export { purchaseEventId } from '$lib/track';

const GRAPH = 'https://graph.facebook.com/v21.0';

export type MetaUser = {
	email?: string | null;
	phone?: string | null;
	firstName?: string | null;
	lastName?: string | null;
	city?: string | null;
	/** _fbp / _fbc cookies — the strongest match signal Meta has. */
	fbp?: string | null;
	fbc?: string | null;
	ip?: string | null;
	userAgent?: string | null;
};

export type MetaEvent = {
	name: 'Purchase' | 'AddToCart' | 'InitiateCheckout' | 'ViewContent' | 'Search';
	eventId: string;
	sourceUrl?: string | null;
	value?: number;
	contents?: { id: string; quantity: number; item_price?: number }[];
	searchString?: string;
};

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

/** Meta requires lowercase, trimmed, then SHA-256. */
export const hashEmail = (email: string): string | null => {
	const clean = email.trim().toLowerCase();
	return clean.includes('@') ? sha256(clean) : null;
};

/**
 * Phones are hashed as digits with the country code and no punctuation.
 *
 * A local 01712345678 becomes 8801712345678 — the leading zero is *replaced* by
 * the country code, not stripped in addition to it. Getting that wrong yields a
 * 12-digit number that hashes to something matching nobody, and nothing in
 * Meta's response tells you: the events are accepted and simply never attribute.
 */
export const hashPhone = (phone: string): string | null => {
	const local = normalizePhone(phone);
	if (local) return sha256(toInternational(local));

	// Not a Bangladeshi mobile — fall back to digits, assuming they already
	// carry a country code.
	const digits = phone.replace(/\D/g, '');
	return digits.length >= 10 ? sha256(digits) : null;
};

export const hashName = (name: string): string | null => {
	const clean = name.trim().toLowerCase().replace(/\s+/g, '');
	return clean ? sha256(clean) : null;
};

/** Builds Meta's user_data block, omitting anything we do not have. */
export function userData(user: MetaUser): Record<string, unknown> {
	const out: Record<string, unknown> = {};
	const em = user.email ? hashEmail(user.email) : null;
	const ph = user.phone ? hashPhone(user.phone) : null;
	const fn = user.firstName ? hashName(user.firstName) : null;
	const ln = user.lastName ? hashName(user.lastName) : null;
	const ct = user.city ? hashName(user.city) : null;

	// Meta expects arrays for the hashed fields.
	if (em) out.em = [em];
	if (ph) out.ph = [ph];
	if (fn) out.fn = [fn];
	if (ln) out.ln = [ln];
	if (ct) out.ct = [ct];
	if (user.fbp) out.fbp = user.fbp;
	if (user.fbc) out.fbc = user.fbc;
	if (user.ip) out.client_ip_address = user.ip;
	if (user.userAgent) out.client_user_agent = user.userAgent;
	return out;
}

export const capiConfigured = (pixelId: string | undefined | null) =>
	!!(pixelId && env.META_CAPI_TOKEN);

/**
 * Sends events server-side. Never throws into a request path: a failed
 * analytics call must not lose an order.
 */
export async function sendEvents(
	pixelId: string,
	events: MetaEvent[],
	user: MetaUser
): Promise<{ sent: number } | { error: string }> {
	if (!capiConfigured(pixelId)) return { error: 'Conversions API is not configured.' };

	const now = Math.floor(Date.now() / 1000);
	const payload = {
		data: events.map((e) => ({
			event_name: e.name,
			event_time: now,
			event_id: e.eventId,
			action_source: 'website',
			event_source_url: e.sourceUrl ?? undefined,
			user_data: userData(user),
			custom_data: {
				currency: 'BDT',
				// Meta wants major units, we store poisha.
				...(e.value !== undefined ? { value: +(e.value / 100).toFixed(2) } : {}),
				...(e.contents ? { contents: e.contents, content_type: 'product' } : {}),
				...(e.searchString ? { search_string: e.searchString } : {})
			}
		})),
		...(env.META_TEST_EVENT_CODE ? { test_event_code: env.META_TEST_EVENT_CODE } : {})
	};

	try {
		const res = await fetch(
			`${GRAPH}/${pixelId}/events?access_token=${encodeURIComponent(env.META_CAPI_TOKEN!)}`,
			{
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(payload)
			}
		);
		const data = (await res.json().catch(() => ({}))) as JsonBody;
		if (!res.ok)
			return { error: data?.error?.message ?? `Meta refused the events (${res.status}).` };
		return { sent: data.events_received ?? events.length };
	} catch (e) {
		return { error: (e as Error).message };
	}
}
