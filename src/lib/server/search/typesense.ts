/**
 * Typesense-backed product search.
 *
 * Postgres `ilike` cannot spell-correct, so "kettel" and "samsng" find nothing
 * — and in this shop's own numbers, a search that finds nothing is the single
 * clearest lost sale. Typesense is typo-tolerant and ranks by relevance.
 *
 * It is optional. With no credentials the shop falls back to the database
 * search, so a clone of this repo runs with nothing extra installed.
 *
 *   TYPESENSE_HOST, TYPESENSE_PORT, TYPESENSE_PROTOCOL, TYPESENSE_API_KEY
 */
import { Client } from 'typesense';
import { env } from '$env/dynamic/private';

export const COLLECTION = 'products';

export const searchConfigured = () => !!(env.TYPESENSE_HOST && env.TYPESENSE_API_KEY);

let client: Client | null = null;

function typesense(): Client | null {
	if (!searchConfigured()) return null;
	client ??= new Client({
		nodes: [
			{
				host: env.TYPESENSE_HOST!,
				port: Number(env.TYPESENSE_PORT ?? 443),
				protocol: env.TYPESENSE_PROTOCOL ?? 'https'
			}
		],
		apiKey: env.TYPESENSE_API_KEY!,
		connectionTimeoutSeconds: 5
	});
	return client;
}

/** One document per product, holding what a shopper searches and filters by. */
export type ProductDoc = {
	id: string;
	title: string;
	titleBn: string;
	brand: string;
	categories: string[];
	categoryIds: string[];
	description: string;
	slug: string;
	price: number;
	rating: number;
	soldCount: number;
	inStock: boolean;
	onSale: boolean;
};

const SCHEMA = {
	name: COLLECTION,
	fields: [
		{ name: 'title', type: 'string' as const },
		// Bangla titles are searched too, so a shopper can type either script.
		{ name: 'titleBn', type: 'string' as const, optional: true },
		{ name: 'brand', type: 'string' as const, facet: true, optional: true },
		{ name: 'categories', type: 'string[]' as const, facet: true, optional: true },
		{ name: 'categoryIds', type: 'string[]' as const, facet: true, optional: true },
		{ name: 'description', type: 'string' as const, optional: true },
		{ name: 'slug', type: 'string' as const, index: false, optional: true },
		{ name: 'price', type: 'int32' as const },
		{ name: 'rating', type: 'int32' as const },
		{ name: 'soldCount', type: 'int32' as const },
		{ name: 'inStock', type: 'bool' as const, facet: true },
		// Computed at index time: "marked down" is a comparison between two
		// prices, and a filter applied after the search would leave the result
		// count reporting the unfiltered number.
		{ name: 'onSale', type: 'bool' as const, facet: true }
	],
	// Ties break towards what sells, which is what a shopper usually wants.
	default_sorting_field: 'soldCount'
};

/** Creates the collection if it is missing. Safe to call on every reindex. */
export async function ensureCollection() {
	const ts = typesense();
	if (!ts) return;
	try {
		await ts.collections(COLLECTION).retrieve();
	} catch {
		await ts.collections().create(SCHEMA);
	}
}

/** Upsert, so a reindex updates in place rather than duplicating. */
export async function indexProducts(docs: ProductDoc[]) {
	const ts = typesense();
	if (!ts || !docs.length) return;
	await ts.collections<ProductDoc>(COLLECTION).documents().import(docs, { action: 'upsert' });
}

export async function removeProduct(id: string) {
	const ts = typesense();
	if (!ts) return;
	// An id that is already gone is not an error worth surfacing.
	await ts
		.collections(COLLECTION)
		.documents(id)
		.delete()
		.catch(() => {});
}

const SORTS: Record<string, string> = {
	newest: '',
	popular: 'soldCount:desc',
	'price-asc': 'price:asc',
	'price-desc': 'price:desc',
	rating: 'rating:desc'
};

/**
 * Returns matching product ids in relevance order, or null when Typesense is
 * not configured or unreachable — the caller then falls back to the database.
 */
export type SearchFilters = {
	minPrice?: number;
	maxPrice?: number;
	brands?: string[];
	minRating?: number;
	inStock?: boolean;
	onSale?: boolean;
};

/** Typesense's filter_by grammar: clauses joined by &&. */
function filterBy(opts: { categoryIds?: string[] } & SearchFilters): string | undefined {
	const parts: string[] = [];
	if (opts.categoryIds?.length) parts.push(`categoryIds:=[${opts.categoryIds.join(',')}]`);
	if (opts.minPrice !== undefined) parts.push(`price:>=${opts.minPrice}`);
	if (opts.maxPrice !== undefined) parts.push(`price:<=${opts.maxPrice}`);
	// Brand names contain spaces and commas, so each is quoted.
	if (opts.brands?.length) parts.push(`brand:=[${opts.brands.map((b) => `\`${b}\``).join(',')}]`);
	if (opts.minRating) parts.push(`rating:>=${opts.minRating * 10}`);
	if (opts.inStock) parts.push('inStock:=true');
	if (opts.onSale) parts.push('onSale:=true');
	return parts.length ? parts.join(' && ') : undefined;
}

export async function searchProductIds(
	opts: {
		q: string;
		categoryIds?: string[];
		sort?: string;
		page?: number;
		perPage?: number;
	} & SearchFilters
): Promise<{ ids: string[]; total: number } | null> {
	const ts = typesense();
	if (!ts) return null;

	const sortBy = SORTS[opts.sort ?? ''] ?? '';
	try {
		const res = await ts
			.collections<ProductDoc>(COLLECTION)
			.documents()
			.search({
				q: opts.q || '*',
				query_by: 'title,titleBn,brand,categories,description',
				// Title matches beat a mention buried in a description.
				query_by_weights: '6,6,4,2,1',
				filter_by: filterBy(opts),
				sort_by: sortBy || undefined,
				per_page: opts.perPage ?? 24,
				page: opts.page ?? 1,
				// Two typos: "washing mashine" and "kettel" both land.
				num_typos: 2
			});

		return {
			ids: (res.hits ?? []).map((h) => h.document.id),
			total: res.found ?? 0
		};
	} catch (e) {
		// A search engine being down must not take the shop's search with it.
		console.error('[typesense] search failed, falling back to the database', e);
		return null;
	}
}
