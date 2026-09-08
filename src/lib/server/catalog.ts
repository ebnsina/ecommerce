/** Product queries shared by the homepage, category pages and search. */
import { and, asc, count, desc, eq, gt, gte, ilike, inArray, lte, or, sql } from 'drizzle-orm';
import { db } from './db';
import { products, productCategories, categories } from './db/schema';

export const cardColumns = {
	id: products.id,
	title: products.title,
	titleBn: products.titleBn,
	slug: products.slug,
	price: products.price,
	compareAtPrice: products.compareAtPrice,
	rating: products.rating,
	reviewCount: products.reviewCount,
	stock: products.stock,
	hasVariants: products.hasVariants,
	// Fully qualified on purpose: interpolated columns come out unqualified, and
	// a bare "id" here would bind to product_images, not products.
	image: sql<string | null>`(select pi.url from product_images pi
		where pi.product_id = products.id order by pi.sort limit 1)`
};

export type Source = 'new-arrival' | 'best-seller' | 'top-rated' | 'featured' | 'hot-deal';

const ordering = {
	'new-arrival': desc(products.createdAt),
	'best-seller': desc(products.soldCount),
	'top-rated': desc(products.rating),
	featured: desc(products.createdAt),
	'hot-deal': desc(sql`(${products.compareAtPrice} - ${products.price})::float
		/ nullif(${products.compareAtPrice}, 0)`)
};

/** Shared by the database path here and, in another shape, by Typesense. */
function filterConditions(f: ProductFilters) {
	return [
		f.minPrice !== undefined ? gte(products.price, f.minPrice) : undefined,
		f.maxPrice !== undefined ? lte(products.price, f.maxPrice) : undefined,
		f.brands?.length ? inArray(products.brand, f.brands) : undefined,
		// Ratings are stored ×10, so four stars is 40.
		f.minRating ? gte(products.rating, f.minRating * 10) : undefined,
		// A product with variants carries its stock on the variants, so it is
		// never counted as out of stock here.
		f.inStock ? sql`(${products.hasVariants} or ${products.stock} > 0)` : undefined,
		f.onSale ? gt(products.compareAtPrice, products.price) : undefined
	];
}

/** The one query behind every product section on the storefront. */
export function productsBy(source: Source, limit = 10) {
	return db
		.select(cardColumns)
		.from(products)
		.where(
			and(
				eq(products.status, 'active'),
				source === 'featured' ? eq(products.featured, true) : undefined,
				source === 'hot-deal' ? gt(products.compareAtPrice, products.price) : undefined
			)
		)
		.orderBy(ordering[source])
		.limit(limit);
}

export async function categoryBySlug(slug: string) {
	const [cat] = await db
		.select()
		.from(categories)
		.where(and(eq(categories.slug, slug), eq(categories.visible, true)))
		.limit(1);
	return cat ?? null;
}

export type ProductFilters = {
	/** Poisha, inclusive. */
	minPrice?: number;
	maxPrice?: number;
	brands?: string[];
	/** Whole stars, 1–5: "4 and up". */
	minRating?: number;
	inStock?: boolean;
	/** Only products marked down from a compare-at price. */
	onSale?: boolean;
};

type ListOptions = ProductFilters & {
	categoryIds?: string[];
	q?: string;
	sort?: string;
	page?: number;
	perPage?: number;
};

const sorts: Record<string, ReturnType<typeof desc>> = {
	newest: desc(products.createdAt),
	'price-asc': asc(products.price),
	'price-desc': desc(products.price),
	rating: desc(products.rating),
	popular: desc(products.soldCount)
};

export async function listProducts({
	categoryIds,
	q,
	sort = 'newest',
	page = 1,
	perPage = 24,
	...filters
}: ListOptions) {
	/* A worded search goes to Typesense when it is set up: it tolerates typos
	   and ranks by relevance, neither of which `ilike` can do. Browsing a
	   category with no query stays on the database, which is already exact and
	   saves a network hop. Import is deferred to keep the cycle
	   catalog → search → catalog from biting at module load. */
	if (q) {
		const { searchProducts } = await import('./search');
		const hit = await searchProducts({ q, categoryIds, sort, page, perPage, ...filters });
		if (hit)
			return {
				rows: hit.rows,
				total: hit.total,
				pages: Math.max(1, Math.ceil(hit.total / perPage)),
				page
			};
	}

	const where = and(
		eq(products.status, 'active'),
		q ? or(ilike(products.title, `%${q}%`), ilike(products.brand, `%${q}%`)) : undefined,
		categoryIds?.length
			? sql`exists (select 1 from ${productCategories}
					where ${productCategories.productId} = ${products.id}
					  and ${productCategories.categoryId} in ${categoryIds})`
			: undefined,
		...filterConditions(filters)
	);

	const [rows, [{ n: total }]] = await Promise.all([
		db
			.select(cardColumns)
			.from(products)
			.where(where)
			.orderBy(sorts[sort] ?? sorts.newest)
			.limit(perPage)
			.offset((page - 1) * perPage),
		db.select({ n: count() }).from(products).where(where)
	]);

	return { rows, total, pages: Math.max(1, Math.ceil(total / perPage)), page };
}

/** Brand strip. Brands live as a text column on products — no separate table
    until they need logos or pages of their own. */
export async function topBrands(limit = 8) {
	const rows = await db
		.select({
			brand: products.brand,
			count: sql<number>`count(*)::int`,
			rating: sql<number>`round(avg(${products.rating}))::int`,
			// array_remove drops products that have no image, so a brand never
			// renders with blank thumbnail slots.
			images: sql<string[]>`(array_remove(array_agg(
				(select pi.url from product_images pi where pi.product_id = products.id
				 order by pi.sort limit 1)
			), null))[1:3]`
		})
		.from(products)
		.where(
			and(
				eq(products.status, 'active'),
				sql`${products.brand} is not null and ${products.brand} <> ''`
			)
		)
		.groupBy(products.brand)
		.orderBy(desc(sql`count(*)`))
		.limit(limit);

	return rows.map((r) => ({
		brand: r.brand!,
		count: r.count,
		rating: r.rating ?? 0,
		images: (r.images ?? []).filter(Boolean).slice(0, 3)
	}));
}
