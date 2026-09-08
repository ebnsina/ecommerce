import { error } from '@sveltejs/kit';
import { and, desc, eq, ne, sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { posts, adminUsers } from '$lib/server/db/schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
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
		.where(eq(posts.slug, params.slug))
		.limit(1);

	if (!post) error(404, 'Post not found');
	// A draft is readable by staff so it can be checked before it goes live.
	if (!post.published && locals.user?.kind !== 'admin') error(404, 'Post not found');

	const more = await db
		.select({
			slug: posts.slug,
			title: posts.title,
			cover: posts.cover,
			publishedAt: posts.publishedAt
		})
		.from(posts)
		.where(and(eq(posts.published, true), ne(posts.id, post.id)))
		.orderBy(desc(posts.publishedAt))
		.limit(3);

	return { post, more };
};
