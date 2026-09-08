import { fail, redirect } from '@sveltejs/kit';
import { desc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { pages } from '$lib/server/db/schema';
import { slugify, uniqueSlug } from '$lib/slug';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => ({
	list: await db.select().from(pages).orderBy(desc(pages.updatedAt))
});

export const actions: Actions = {
	create: async ({ request }) => {
		const form = await request.formData();
		const title = String(form.get('title') ?? '').trim();
		if (!title) return fail(400, { error: 'Give the page a title.' });

		const taken = await db.select({ slug: pages.slug }).from(pages);
		const [row] = await db
			.insert(pages)
			.values({
				title,
				slug: uniqueSlug(
					slugify(String(form.get('slug') ?? '') || title),
					new Set(taken.map((t) => t.slug))
				),
				blocks: [],
				published: false
			})
			.returning({ id: pages.id });

		redirect(303, `/admin/pages/${row.id}`);
	},

	remove: async ({ request }) => {
		const id = String((await request.formData()).get('id') ?? '');
		const [row] = await db.select().from(pages).where(eq(pages.id, id)).limit(1);
		if (row?.slug === 'home') return fail(400, { error: 'The homepage cannot be deleted.' });
		await db.delete(pages).where(eq(pages.id, id));
		return { ok: true };
	}
};
