import { error, fail, redirect } from '@sveltejs/kit';
import { eq, ne } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { posts, adminUsers } from '$lib/server/db/schema';
import { sanitizeHtml } from '$lib/sanitize';
import { slugify, uniqueSlug } from '$lib/slug';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const [post] = await db
		.select({
			id: posts.id,
			slug: posts.slug,
			title: posts.title,
			titleBn: posts.titleBn,
			excerpt: posts.excerpt,
			body: posts.body,
			cover: posts.cover,
			tags: posts.tags,
			seoTitle: posts.seoTitle,
			seoDescription: posts.seoDescription,
			published: posts.published,
			publishedAt: posts.publishedAt,
			author: adminUsers.name
		})
		.from(posts)
		.leftJoin(adminUsers, eq(adminUsers.id, posts.authorId))
		.where(eq(posts.id, params.id))
		.limit(1);

	if (!post) error(404, 'Post not found');
	return { post };
};

export const actions: Actions = {
	save: async ({ request, params }) => {
		const f = await request.formData();
		const title = String(f.get('title') ?? '').trim();
		if (!title) return fail(400, { error: 'The post needs a title.' });

		const wanted = slugify(String(f.get('slug') ?? '') || title);
		const taken = new Set(
			(await db.select({ slug: posts.slug }).from(posts).where(ne(posts.id, params.id))).map(
				(p) => p.slug
			)
		);

		const publish = f.get('publish') === 'on';
		const [current] = await db
			.select({ publishedAt: posts.publishedAt })
			.from(posts)
			.where(eq(posts.id, params.id))
			.limit(1);

		await db
			.update(posts)
			.set({
				title,
				titleBn: String(f.get('titleBn') ?? '').trim() || null,
				slug: uniqueSlug(wanted, taken),
				excerpt: String(f.get('excerpt') ?? '').trim() || null,
				// The editor's HTML is never trusted: it reaches shoppers' browsers.
				body: sanitizeHtml(String(f.get('body') ?? '')),
				cover: String(f.get('cover') ?? '').trim() || null,
				tags: String(f.get('tags') ?? '')
					.split(',')
					.map((t) => t.trim())
					.filter(Boolean),
				seoTitle: String(f.get('seoTitle') ?? '').trim() || null,
				seoDescription: String(f.get('seoDescription') ?? '').trim() || null,
				published: publish,
				// Set once, the first time it goes live, so unpublishing and
				// republishing does not push it back to the top of the blog.
				publishedAt: publish ? (current?.publishedAt ?? new Date()) : current?.publishedAt,
				updatedAt: new Date()
			})
			.where(eq(posts.id, params.id));

		return { saved: publish ? 'published' : 'draft' };
	},

	remove: async ({ params }) => {
		await db.delete(posts).where(eq(posts.id, params.id));
		redirect(303, '/admin/posts');
	}
};
