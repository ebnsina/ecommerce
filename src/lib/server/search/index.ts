/**
 * Search: Typesense when it is configured and reachable, the database when it
 * is not. One function so no caller has to know which.
 */
import { eq, inArray, sql } from 'drizzle-orm';
import { db } from '../db';
import { products, categories, productCategories } from '../db/schema';
import { cardColumns } from '../catalog';
import {
	ensureCollection,
	indexProducts,
	removeProduct,
	searchProductIds,
	searchConfigured,
	type ProductDoc
} from './typesense';

export { searchConfigured, removeProduct };

/** Builds the searchable document for one product, or several. */
export async function documentsFor(ids?: string[]): Promise<ProductDoc[]> {
	const rows = await db
		.select({
			id: products.id,
			title: products.title,
			titleBn: products.titleBn,
			brand: products.brand,
			description: products.description,
			slug: products.slug,
			price: products.price,
			rating: products.rating,
			soldCount: products.soldCount,
			stock: products.stock,
			hasVariants: products.hasVariants
		})
		.from(products)
		.where(ids?.length ? inArray(products.id, ids) : eq(products.status, 'active'));

	if (!rows.length) return [];

	const cats = await db
		.select({
			productId: productCategories.productId,
			id: categories.id,
			name: categories.name
		})
		.from(productCategories)
		.innerJoin(categories, eq(categories.id, productCategories.categoryId))
		.where(
			inArray(
				productCategories.productId,
				rows.map((r) => r.id)
			)
		);

	const byProduct = new Map<string, { id: string; name: string }[]>();
	for (const c of cats) {
		const list = byProduct.get(c.productId) ?? [];
		list.push({ id: c.id, name: c.name });
		byProduct.set(c.productId, list);
	}

	return rows.map((r) => ({
		id: r.id,
		title: r.title,
		titleBn: r.titleBn ?? '',
		brand: r.brand ?? '',
		categories: (byProduct.get(r.id) ?? []).map((c) => c.name),
		categoryIds: (byProduct.get(r.id) ?? []).map((c) => c.id),
		// Descriptions carry HTML from the editor; the tags are noise to a
		// search index and would match on "strong" and "div".
		description: (r.description ?? '').replace(/<[^>]*>/g, ' ').slice(0, 2000),
		slug: r.slug,
		price: r.price,
		rating: r.rating,
		soldCount: r.soldCount,
		inStock: r.hasVariants || r.stock > 0
	}));
}

/** Rebuilds the whole index. Returns how many documents went in. */
export async function reindexAll() {
	if (!searchConfigured()) return { indexed: 0, configured: false };
	await ensureCollection();
	const docs = await documentsFor();
	await indexProducts(docs);
	return { indexed: docs.length, configured: true };
}

/** Keeps one product in step after an edit. Never throws into a save. */
export async function reindexProduct(id: string) {
	if (!searchConfigured()) return;
	try {
		await ensureCollection();
		await indexProducts(await documentsFor([id]));
	} catch (e) {
		console.error('[search] could not reindex product', id, e);
	}
}

/**
 * Full-text product search. Falls back to the database whenever Typesense has
 * nothing to say — not configured, unreachable, or mid-reindex.
 */
export async function searchProducts(opts: {
	q: string;
	categoryIds?: string[];
	sort?: string;
	page?: number;
	perPage?: number;
}) {
	const hit = await searchProductIds(opts);
	if (!hit) return null;
	if (!hit.ids.length) return { rows: [], total: hit.total };

	const rows = await db.select(cardColumns).from(products).where(inArray(products.id, hit.ids));

	// Typesense ranked them; the database returned them in its own order.
	const order = new Map(hit.ids.map((id, i) => [id, i]));
	rows.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));

	return { rows, total: hit.total };
}
