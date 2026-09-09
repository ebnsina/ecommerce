import { fail } from '@sveltejs/kit';
import { and, count, desc, eq, ilike, inArray, or } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { leads } from '$lib/server/db/schema';
import { listParams } from '$lib/admin/listQuery';
import type { Actions, PageServerLoad } from './$types';

const STATUSES = ['new', 'contacted', 'qualified', 'lost'] as const;
type Status = (typeof STATUSES)[number];

const isStatus = (v: string): v is Status => (STATUSES as readonly string[]).includes(v);

export const load: PageServerLoad = async ({ url }) => {
	const { q, page, perPage } = listParams(url);
	const status = url.searchParams.get('status') ?? '';

	const where = and(
		q
			? or(
					ilike(leads.name, `%${q}%`),
					ilike(leads.phone, `%${q}%`),
					ilike(leads.shopName, `%${q}%`),
					ilike(leads.sells, `%${q}%`)
				)
			: undefined,
		isStatus(status) ? eq(leads.status, status) : undefined
	);

	const [rows, [{ n: total }], [{ n: fresh }]] = await Promise.all([
		db
			.select()
			.from(leads)
			.where(where)
			// Newest first: a lead goes cold in a day, and the top of this list is
			// the call to make now.
			.orderBy(desc(leads.seenAt))
			.limit(perPage)
			.offset((page - 1) * perPage),
		db.select({ n: count() }).from(leads).where(where),
		db.select({ n: count() }).from(leads).where(eq(leads.status, 'new'))
	]);

	return { rows, total, page, perPage, fresh, filters: { q, status } };
};

export const actions: Actions = {
	/** Move one lead, or a selection of them, along. */
	setStatus: async ({ request }) => {
		const f = await request.formData();
		const status = String(f.get('status') ?? '');
		if (!isStatus(status)) return fail(400, { error: 'That is not a status.' });

		const ids = String(f.get('ids') ?? f.get('id') ?? '')
			.split(',')
			.filter(Boolean);
		if (!ids.length) return fail(400, { error: 'Nothing was selected.' });

		await db.update(leads).set({ status }).where(inArray(leads.id, ids));
		return { ok: true };
	},

	note: async ({ request }) => {
		const f = await request.formData();
		const id = String(f.get('id') ?? '');
		if (!id) return fail(400, { error: 'Nothing was selected.' });

		const note = String(f.get('note') ?? '').trim();
		await db
			.update(leads)
			.set({ note: note ? note.slice(0, 2000) : null })
			.where(eq(leads.id, id));
		return { ok: true };
	},

	remove: async ({ request }) => {
		const f = await request.formData();
		const ids = String(f.get('ids') ?? f.get('id') ?? '')
			.split(',')
			.filter(Boolean);
		if (!ids.length) return fail(400, { error: 'Nothing was selected.' });

		await db.delete(leads).where(inArray(leads.id, ids));
		return { ok: true };
	}
};
