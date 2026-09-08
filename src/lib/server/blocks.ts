/** Turns stored blocks into render-ready blocks by resolving their product sources. */
import { and, eq, inArray, sql } from 'drizzle-orm';
import { db } from './db';
import { products, productCategories } from './db/schema';
import { cardColumns, productsBy, topBrands, type Source } from './catalog';
import type { ProductSource } from '$lib/blocks/schema';
import type { Block } from './db/schema';
import { sanitizeHtml } from '$lib/sanitize';

const RULES: Source[] = ['new-arrival', 'best-seller', 'top-rated', 'featured', 'hot-deal'];

async function resolveSource(source: ProductSource | undefined) {
	if (!source) return [];
	const limit = Math.min(24, Math.max(1, Number(source.limit) || 10));

	if (source.mode === 'manual') {
		if (!source.ids?.length) return [];
		const rows = await db
			.select(cardColumns)
			.from(products)
			.where(and(eq(products.status, 'active'), inArray(products.id, source.ids)));
		// Keep the order the admin chose.
		return source.ids
			.map((id) => rows.find((r) => r.id === id))
			.filter(Boolean)
			.slice(0, limit);
	}

	if (source.mode === 'category') {
		if (!source.categoryId) return [];
		return db
			.select(cardColumns)
			.from(products)
			.where(
				and(
					eq(products.status, 'active'),
					sql`exists (select 1 from ${productCategories}
						where ${productCategories.productId} = ${products.id}
						  and ${productCategories.categoryId} = ${source.categoryId})`
				)
			)
			.limit(limit);
	}

	const rule = RULES.includes(source.rule as Source) ? (source.rule as Source) : 'new-arrival';
	return productsBy(rule, limit);
}

/** Blocks that carry a product list; everything else renders straight from props. */
const NEEDS_PRODUCTS = new Set(['hotDeals', 'productSection', 'productGrid']);

export async function resolveBlocks(blocks: Block[]) {
	return Promise.all(
		blocks.map(async (block) => ({
			...block,
			// Rich text is rendered with {@html}; clean it here so no route can
			// forget to.
			props:
				block.type === 'richText'
					? { ...block.props, body: sanitizeHtml(String(block.props.body ?? '')) }
					: block.props,
			products: NEEDS_PRODUCTS.has(block.type)
				? await resolveSource(block.props.source as ProductSource)
				: undefined,
			brands: block.type === 'brands' ? await topBrands(Number(block.props.limit) || 8) : undefined
		}))
	);
}
