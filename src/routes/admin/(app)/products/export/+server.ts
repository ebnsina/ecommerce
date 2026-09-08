import { and, eq, ilike, or, sql, desc } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { products, categories, productCategories } from '$lib/server/db/schema';
import { toCsv } from '$lib/csv';
import { PRODUCT_CSV_COLUMNS } from '$lib/productCsv';
import type { RequestHandler } from './$types';

const tk = (poisha: number | null) => (poisha === null ? '' : (poisha / 100).toFixed(2));

/** Exports whatever the list page is currently filtered to, so "export what I see" holds. */
export const GET: RequestHandler = async ({ url }) => {
	const q = url.searchParams.get('q')?.trim() ?? '';
	const status = url.searchParams.get('status') ?? '';
	const categoryId = url.searchParams.get('category') ?? '';

	const rows = await db
		.select({
			slug: products.slug,
			title: products.title,
			title_bn: products.titleBn,
			brand: products.brand,
			status: products.status,
			price: products.price,
			compare_at_price: products.compareAtPrice,
			cost: products.cost,
			stock: products.stock,
			featured: products.featured,
			description: products.description,
			seo_title: products.seoTitle,
			seo_description: products.seoDescription,
			categories: sql<string>`coalesce((
				select string_agg(c.name, ';' order by c.name)
				from product_categories pc join categories c on c.id = pc.category_id
				where pc.product_id = products.id
			), '')`
		})
		.from(products)
		.where(
			and(
				q ? or(ilike(products.title, `%${q}%`), ilike(products.slug, `%${q}%`)) : undefined,
				status ? eq(products.status, status as 'active') : undefined,
				categoryId
					? sql`exists (select 1 from product_categories pc
							where pc.product_id = products.id and pc.category_id = ${categoryId})`
					: undefined
			)
		)
		.orderBy(desc(products.createdAt))
		.limit(10000);

	const csv = toCsv(
		[...PRODUCT_CSV_COLUMNS],
		rows.map((r) => ({
			...r,
			price: tk(r.price),
			compare_at_price: tk(r.compare_at_price),
			cost: tk(r.cost),
			featured: r.featured ? 'yes' : 'no'
		}))
	);

	const stamp = new Date().toISOString().slice(0, 10);
	return new Response('﻿' + csv, {
		headers: {
			// BOM so Excel opens Bangla titles as UTF-8 instead of mojibake.
			'content-type': 'text/csv; charset=utf-8',
			'content-disposition': `attachment; filename="products-${stamp}.csv"`
		}
	});
};
