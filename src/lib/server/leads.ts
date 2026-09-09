import { sql } from 'drizzle-orm';
import { db } from './db';
import { leads } from './db/schema';
import { normalizePhone } from '$lib/phone';
import { consume } from './ratelimit';

export type LeadInput = {
	name: string;
	phone: string;
	shopName?: string;
	sells?: string;
	sellsOn?: string;
	source?: string;
};

export type LeadResult = { ok: true } | { ok: false; error: string; field?: 'name' | 'phone' };

const clean = (v: string | undefined, max: number) => {
	const t = (v ?? '').trim();
	return t ? t.slice(0, max) : null;
};

/**
 * Records someone who wants a shop of their own.
 *
 * The phone number is the identity, so filling the form again updates the row
 * instead of adding a second one — the same person from a phone and then a
 * laptop is one lead, not two. `createdAt` keeps the first sighting; `seenAt`
 * moves. A status or note set by whoever is following up is never overwritten
 * by a later submission.
 */
export async function saveLead(input: LeadInput, ip: string): Promise<LeadResult> {
	const name = clean(input.name, 80);
	if (!name) return { ok: false, error: 'Tell us your name.', field: 'name' };

	const phone = normalizePhone(input.phone ?? '');
	if (!phone)
		return { ok: false, error: 'That is not a Bangladeshi mobile number.', field: 'phone' };

	// Generous, because a real person correcting a typo must not be locked out;
	// tight enough that the table cannot be filled from one machine.
	const limit = await consume(`lead:${ip}`, 10, 60 * 60);
	if (!limit.ok) return { ok: false, error: 'Too many tries. Try again in an hour.' };

	await db
		.insert(leads)
		.values({
			name,
			phone,
			shopName: clean(input.shopName, 120),
			sells: clean(input.sells, 200),
			sellsOn: clean(input.sellsOn, 40),
			source: clean(input.source, 40) ?? 'demo'
		})
		.onConflictDoUpdate({
			target: leads.phone,
			set: {
				name,
				shopName: clean(input.shopName, 120),
				sells: clean(input.sells, 200),
				sellsOn: clean(input.sellsOn, 40),
				seenAt: sql`now()`
			}
		});

	return { ok: true };
}
