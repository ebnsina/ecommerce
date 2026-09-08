import { fail, redirect } from '@sveltejs/kit';
import { and, count, desc, eq, ilike, or } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { posts, adminUsers } from '$lib/server/db/schema';
import { slugify, uniqueSlug } from '$lib/slug';
import { listParams } from '$lib/admin/listQuery';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const { q, page, perPage } = listParams(url);
	const status = url.searchParams.get('status') ?? '';

	const where = and(
		q ? or(ilike(posts.title, `%${q}%`), ilike(posts.excerpt, `%${q}%`)) : undefined,
		status === 'published' ? eq(posts.published, true) : undefined,
		status === 'draft' ? eq(posts.published, false) : undefined
	);

	const [rows, [{ n: total }]] = await Promise.all([
		db
			.select({
				id: posts.id,
				slug: posts.slug,
				title: posts.title,
				cover: posts.cover,
				tags: posts.tags,
				published: posts.published,
				publishedAt: posts.publishedAt,
				updatedAt: posts.updatedAt,
				author: adminUsers.name
			})
			.from(posts)
			.leftJoin(adminUsers, eq(adminUsers.id, posts.authorId))
			.where(where)
			// Drafts first — they are the ones with work left in them.
			.orderBy(posts.published, desc(posts.updatedAt))
			.limit(perPage)
			.offset((page - 1) * perPage),
		db.select({ n: count() }).from(posts).where(where)
	]);

	return { rows, total, page, perPage, filters: { q, status } };
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const title = String((await request.formData()).get('title') ?? '').trim();
		if (!title) return fail(400, { error: 'Give the post a title.' });

		const taken = new Set((await db.select({ slug: posts.slug }).from(posts)).map((p) => p.slug));
		const [row] = await db
			.insert(posts)
			.values({
				title,
				slug: uniqueSlug(slugify(title), taken),
				authorId: locals.user?.kind === 'admin' ? locals.user.id : null
			})
			.returning({ id: posts.id });

		redirect(303, `/admin/posts/${row.id}`);
	},

	remove: async ({ request }) => {
		const f = await request.formData();
		const ids = String(f.get('ids') ?? f.get('id') ?? '')
			.split(',')
			.filter(Boolean);
		for (const id of ids) await db.delete(posts).where(eq(posts.id, id));
		return { ok: true };
	},

	toggle: async ({ request }) => {
		const id = String((await request.formData()).get('id') ?? '');
		const [row] = await db
			.select({ published: posts.published, publishedAt: posts.publishedAt })
			.from(posts)
			.where(eq(posts.id, id))
			.limit(1);
		if (!row) return fail(404, { error: 'That post is gone.' });

		await db
			.update(posts)
			.set({
				published: !row.published,
				// The publish date is set once, the first time it goes live, so
				// unpublishing and republishing does not reorder the blog.
				publishedAt: row.publishedAt ?? new Date(),
				updatedAt: new Date()
			})
			.where(eq(posts.id, id));
		return { ok: true };
	}
};
