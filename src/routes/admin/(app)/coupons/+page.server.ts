import { fail } from '@sveltejs/kit';
import { desc, eq, ne, and } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { coupons } from '$lib/server/db/schema';
import { parseTk } from '$lib/money';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => ({
	list: await db.select().from(coupons).orderBy(desc(coupons.active), coupons.code)
});

const dt = (v: FormDataEntryValue | null) => {
	const s = String(v ?? '').trim();
	return s ? new Date(s) : null;
};

export const actions: Actions = {
	save: async ({ request }) => {
		const f = await request.formData();
		const id = String(f.get('id') ?? '');
		const code = String(f.get('code') ?? '')
			.trim()
			.toUpperCase();
		const type = String(f.get('type') ?? 'percent') as 'percent' | 'fixed' | 'free_shipping';

		if (!/^[A-Z0-9_-]{3,24}$/.test(code))
			return fail(400, { error: 'Codes are 3–24 letters, digits, dashes or underscores.' });

		let value = 0;
		let minOrder = 0;
		try {
			minOrder = parseTk(String(f.get('minOrder') ?? '0') || '0');
			if (type === 'percent') {
				value = Number(f.get('value') ?? 0);
				if (!(value > 0 && value <= 90))
					return fail(400, { error: 'A percentage discount must be between 1 and 90.' });
			} else if (type === 'fixed') {
				value = parseTk(String(f.get('value') ?? '0'));
				if (value <= 0) return fail(400, { error: 'Enter the discount amount.' });
			}
		} catch (e) {
			return fail(400, { error: (e as Error).message });
		}

		const starts = dt(f.get('startsAt'));
		const ends = dt(f.get('endsAt'));
		if (starts && ends && ends <= starts)
			return fail(400, { error: 'The end date must be after the start date.' });

		// Codes are typed by customers — a duplicate would be ambiguous.
		const clash = await db
			.select({ id: coupons.id })
			.from(coupons)
			.where(id ? and(eq(coupons.code, code), ne(coupons.id, id)) : eq(coupons.code, code))
			.limit(1);
		if (clash.length) return fail(400, { error: `${code} is already in use.` });

		const values = {
			code,
			type,
			value,
			minOrder,
			usageLimit: f.get('usageLimit') ? Number(f.get('usageLimit')) : null,
			perCustomerLimit: Math.max(1, Number(f.get('perCustomerLimit')) || 1),
			startsAt: starts,
			endsAt: ends,
			active: f.get('active') === 'on'
		};

		if (id) await db.update(coupons).set(values).where(eq(coupons.id, id));
		else await db.insert(coupons).values(values);

		return { ok: true };
	},

	toggle: async ({ request }) => {
		const id = String((await request.formData()).get('id') ?? '');
		const [row] = await db.select().from(coupons).where(eq(coupons.id, id)).limit(1);
		if (row) await db.update(coupons).set({ active: !row.active }).where(eq(coupons.id, id));
		return { ok: true };
	},

	remove: async ({ request }) => {
		await db
			.delete(coupons)
			.where(eq(coupons.id, String((await request.formData()).get('id') ?? '')));
		return { ok: true };
	}
};
