import { and, count, desc, eq, sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { posts, adminUsers } from '$lib/server/db/schema';
import type { PageServerLoad } from './$types';

const PER_PAGE = 12;

export const load: PageServerLoad = async ({ url }) => {
	const page = Math.max(1, Number(url.searchParams.get('page') ?? 1));
	const tag = url.searchParams.get('tag')?.trim() ?? '';

	const where = and(eq(posts.published, true), tag ? sql`${tag} = any(${posts.tags})` : undefined);

	const [rows, [{ n: total }], tagRows] = await Promise.all([
		db
			.select({
				slug: posts.slug,
				title: posts.title,
				excerpt: posts.excerpt,
				cover: posts.cover,
				tags: posts.tags,
				publishedAt: posts.publishedAt,
				author: adminUsers.name
			})
			.from(posts)
			.leftJoin(adminUsers, eq(adminUsers.id, posts.authorId))
			.where(where)
			.orderBy(desc(posts.publishedAt))
			.limit(PER_PAGE)
			.offset((page - 1) * PER_PAGE),
		db.select({ n: count() }).from(posts).where(where),
		db
			.select({ tag: sql<string>`unnest(${posts.tags})`.as('tag') })
			.from(posts)
			.where(eq(posts.published, true))
	]);

	return {
		rows,
		total,
		page,
		pages: Math.max(1, Math.ceil(total / PER_PAGE)),
		tags: [...new Set(tagRows.map((t) => t.tag))].sort(),
		tag
	};
};
