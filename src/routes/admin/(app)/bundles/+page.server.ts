import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { bundles } from '$lib/server/db/schema';
import { listBundles } from '$lib/server/bundles';
import { slugify, uniqueSlug } from '$lib/slug';
import { listParams } from '$lib/admin/listQuery';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const { q, page, perPage } = listParams(url);
	const status = url.searchParams.get('status') ?? '';

	// Bundles are few by nature — a shop has a handful, not thousands — so the
	// set is read whole and narrowed here rather than in three SQL variants.
	const all = await listBundles();
	const needle = q.toLowerCase();
	const list = all.filter(
		(b) =>
			(!needle || b.title.toLowerCase().includes(needle)) &&
			(status !== 'active' || b.active) &&
			(status !== 'off' || !b.active) &&
			(status !== 'incomplete' || b.items.length < 2)
	);

	return {
		rows: list.slice((page - 1) * perPage, page * perPage),
		total: list.length,
		page,
		perPage,
		filters: { q, status }
	};
};

export const actions: Actions = {
	create: async ({ request }) => {
		const title = String((await request.formData()).get('title') ?? '').trim();
		if (!title) return fail(400, { error: 'Give the bundle a name.' });

		const taken = await db.select({ slug: bundles.slug }).from(bundles);
		const [row] = await db
			.insert(bundles)
			.values({
				title,
				slug: uniqueSlug(slugify(title), new Set(taken.map((t) => t.slug))),
				price: 0,
				active: false // a bundle with no items must not go live
			})
			.returning({ id: bundles.id });

		redirect(303, `/admin/bundles/${row.id}`);
	},

	toggle: async ({ request }) => {
		const id = String((await request.formData()).get('id') ?? '');
		const [row] = await db.select().from(bundles).where(eq(bundles.id, id)).limit(1);
		if (row) await db.update(bundles).set({ active: !row.active }).where(eq(bundles.id, id));
		return { ok: true };
	},

	remove: async ({ request }) => {
		await db
			.delete(bundles)
			.where(eq(bundles.id, String((await request.formData()).get('id') ?? '')));
		return { ok: true };
	}
};
