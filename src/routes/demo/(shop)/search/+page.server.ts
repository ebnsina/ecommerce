import { and, asc, eq, isNotNull, ne, sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { products, categories } from '$lib/server/db/schema';
import { listProducts, type ProductFilters } from '$lib/server/catalog';
import { recordSearch } from '$lib/server/intent';
import type { PageServerLoad } from './$types';

/** Taka in the URL, poisha everywhere behind it. */
const poisha = (v: string | null) => {
	if (!v) return undefined;
	const n = Number(v);
	return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : undefined;
};

export const load: PageServerLoad = async ({ url, locals }) => {
	const q = url.searchParams.get('q')?.trim() ?? '';
	const sort = url.searchParams.get('sort') ?? 'newest';
	const page = Math.max(1, Number(url.searchParams.get('page') ?? 1));

	const brands = url.searchParams.getAll('brand').filter(Boolean);
	const categorySlugs = url.searchParams.getAll('category').filter(Boolean);
	const minRating = Number(url.searchParams.get('rating') ?? 0);

	const chosen = categorySlugs.length
		? await db
				.select({ id: categories.id, slug: categories.slug })
				.from(categories)
				.where(sql`${categories.slug} in ${categorySlugs}`)
		: [];

	const filters: ProductFilters = {
		minPrice: poisha(url.searchParams.get('min')),
		maxPrice: poisha(url.searchParams.get('max')),
		brands: brands.length ? brands : undefined,
		minRating: minRating >= 1 && minRating <= 5 ? minRating : undefined,
		inStock: url.searchParams.get('stock') === '1',
		onSale: url.searchParams.get('sale') === '1'
	};

	const [list, facets] = await Promise.all([
		listProducts({
			q: q || undefined,
			sort,
			page,
			categoryIds: chosen.length ? chosen.map((c) => c.id) : undefined,
			...filters
		}),
		// The facet lists come from the catalogue rather than the current result
		// set: a filter that vanishes as soon as you use it cannot be undone.
		Promise.all([
			db
				.select({ id: categories.id, name: categories.name, slug: categories.slug })
				.from(categories)
				.where(eq(categories.visible, true))
				.orderBy(asc(categories.sort), asc(categories.name)),
			db
				.selectDistinct({ brand: products.brand })
				.from(products)
				.where(
					and(eq(products.status, 'active'), isNotNull(products.brand), ne(products.brand, ''))
				)
				.orderBy(asc(products.brand)),
			db
				.select({
					min: sql<number>`min(${products.price})`.as('min'),
					max: sql<number>`max(${products.price})`.as('max')
				})
				.from(products)
				.where(eq(products.status, 'active'))
		])
	]);

	if (q && page === 1)
		recordSearch(q, list.total, locals.user?.kind === 'customer' ? locals.user.id : null);

	const [cats, brandRows, [range]] = facets;

	return {
		q,
		sort,
		...list,
		facets: {
			categories: cats,
			brands: brandRows.map((b) => b.brand!).filter(Boolean),
			priceMin: Math.floor((range?.min ?? 0) / 100),
			priceMax: Math.ceil((range?.max ?? 0) / 100)
		},
		filters: {
			categories: categorySlugs,
			brands,
			min: url.searchParams.get('min') ?? '',
			max: url.searchParams.get('max') ?? '',
			rating: filters.minRating ?? 0,
			stock: !!filters.inStock,
			sale: !!filters.onSale
		}
	};
};
