import { and, desc, eq, ilike, or, sql, count } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { products, productImages, categories, productCategories } from '$lib/server/db/schema';
import { listParams } from '$lib/admin/listQuery';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const { q, page, perPage } = listParams(url);
	const status = url.searchParams.get('status') ?? '';
	const categoryId = url.searchParams.get('category') ?? '';
	const lowStock = url.searchParams.get('filter') === 'low-stock';

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
			.limit(perPage)
			.offset((page - 1) * perPage),

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
		perPage,
		filters: { q, status, categoryId, lowStock }
	};
};
