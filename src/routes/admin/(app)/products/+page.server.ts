import { and, desc, eq, ilike, or, sql, count, inArray } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { products, productImages, categories, productCategories } from '$lib/server/db/schema';
import type { PageServerLoad } from './$types';

const PER_PAGE = 25;

export const load: PageServerLoad = async ({ url }) => {
	const q = url.searchParams.get('q')?.trim() ?? '';
	const status = url.searchParams.get('status') ?? '';
	const categoryId = url.searchParams.get('category') ?? '';
	const lowStock = url.searchParams.get('filter') === 'low-stock';
	const page = Math.max(1, Number(url.searchParams.get('page') ?? 1));

	const where = and(
		q ? or(ilike(products.title, `%${q}%`), ilike(products.slug, `%${q}%`)) : undefined,
		status ? eq(products.status, status as 'draft' | 'active' | 'archived') : undefined,
		lowStock ? sql`${products.stock} <= 5` : undefined,
		categoryId
			? sql`exists (select 1 from ${productCategories}
					where ${productCategories.productId} = ${products.id}
					  and ${productCategories.categoryId} = ${categoryId})`
			: undefined
	);

	const [rows, [{ n: total }], cats] = await Promise.all([
		db
			.select({
				id: products.id,
				title: products.title,
				slug: products.slug,
				status: products.status,
				price: products.price,
				compareAtPrice: products.compareAtPrice,
				stock: products.stock,
				hasVariants: products.hasVariants,
				featured: products.featured,
				image: sql<string | null>`(select url from ${productImages}
					where ${productImages.productId} = ${products.id}
					order by sort limit 1)`
			})
			.from(products)
			.where(where)
			.orderBy(desc(products.createdAt))
			.limit(PER_PAGE)
			.offset((page - 1) * PER_PAGE),

		db.select({ n: count() }).from(products).where(where),

		db
			.select({ id: categories.id, name: categories.name })
			.from(categories)
			.orderBy(categories.name)
	]);

	return {
		rows,
		categories: cats,
		total,
		page,
		pages: Math.max(1, Math.ceil(total / PER_PAGE)),
		filters: { q, status, categoryId, lowStock }
	};
};
