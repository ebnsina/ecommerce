import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { categories } from '$lib/server/db/schema';
import { categoryBySlug, listProducts } from '$lib/server/catalog';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url }) => {
	const category = await categoryBySlug(params.slug);
	if (!category) error(404, 'Category not found');

	// A parent category shows its children's products too.
	const children = await db
		.select({ id: categories.id, name: categories.name, slug: categories.slug })
		.from(categories)
		.where(eq(categories.parentId, category.id));

	const list = await listProducts({
		categoryIds: [category.id, ...children.map((c) => c.id)],
		sort: url.searchParams.get('sort') ?? 'newest',
		page: Math.max(1, Number(url.searchParams.get('page') ?? 1))
	});

	return { category, children, ...list, sort: url.searchParams.get('sort') ?? 'newest' };
};
