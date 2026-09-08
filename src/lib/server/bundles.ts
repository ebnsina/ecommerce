/**
 * Bundles: a fixed set of products sold together for one price.
 *
 * The price is distributed across the member lines when a bundle is added to
 * the cart, so orders need no bundle concept — every order line still carries
 * its own snapshot price and the totals add up without special cases.
 */
import { and, asc, eq, inArray, sql } from 'drizzle-orm';
import { db } from './db';
import { bundles, bundleItems, products, variants, cartItems } from './db/schema';

export type BundleMember = {
	productId: string;
	variantId: string | null;
	qty: number;
	title: string;
	slug: string;
	image: string | null;
	unitPrice: number;
	stock: number;
};

export type BundleView = {
	id: string;
	title: string;
	slug: string;
	description: string | null;
	image: string | null;
	price: number;
	/** Sum of the members at their normal prices — the struck-through figure. */
	worth: number;
	saving: number;
	items: BundleMember[];
	inStock: boolean;
	/** Whether the shop is showing it. The admin needs this to say so. */
	active: boolean;
};

async function membersFor(bundleIds: string[]): Promise<Map<string, BundleMember[]>> {
	if (!bundleIds.length) return new Map();

	const rows = await db
		.select({
			bundleId: bundleItems.bundleId,
			productId: bundleItems.productId,
			variantId: bundleItems.variantId,
			qty: bundleItems.qty,
			title: products.title,
			slug: products.slug,
			status: products.status,
			productPrice: products.price,
			productStock: products.stock,
			hasVariants: products.hasVariants,
			variantPrice: variants.price,
			variantStock: variants.stock,
			image: sql<string | null>`(select pi.url from product_images pi
				where pi.product_id = products.id order by pi.sort limit 1)`
		})
		.from(bundleItems)
		.innerJoin(products, eq(products.id, bundleItems.productId))
		.leftJoin(variants, eq(variants.id, bundleItems.variantId))
		.where(inArray(bundleItems.bundleId, bundleIds));

	const map = new Map<string, BundleMember[]>();
	for (const r of rows) {
		if (r.status !== 'active') continue;
		const list = map.get(r.bundleId) ?? [];
		list.push({
			productId: r.productId,
			variantId: r.variantId,
			qty: r.qty,
			title: r.title,
			slug: r.slug,
			image: r.image,
			unitPrice: r.variantPrice ?? r.productPrice,
			stock: r.variantId ? (r.variantStock ?? 0) : r.hasVariants ? 1 : r.productStock
		});
		map.set(r.bundleId, list);
	}
	return map;
}

function toView(row: typeof bundles.$inferSelect, items: BundleMember[]): BundleView {
	const worth = items.reduce((n, i) => n + i.unitPrice * i.qty, 0);
	return {
		id: row.id,
		title: row.title,
		slug: row.slug,
		description: row.description,
		image: row.image,
		price: row.price,
		worth,
		saving: Math.max(0, worth - row.price),
		items,
		// A bundle is only buyable while every member is in stock.
		inStock: items.length > 0 && items.every((i) => i.stock >= i.qty),
		active: row.active
	};
}

export async function getBundle(idOrSlug: string): Promise<BundleView | null> {
	const [row] = await db
		.select()
		.from(bundles)
		.where(sql`${bundles.id}::text = ${idOrSlug} or ${bundles.slug} = ${idOrSlug}`)
		.limit(1);
	if (!row) return null;
	const members = await membersFor([row.id]);
	return toView(row, members.get(row.id) ?? []);
}

/** Bundles that include a given product — the "buy it together" offer on a PDP. */
export async function bundlesForProduct(productId: string): Promise<BundleView[]> {
	const rows = await db
		.select()
		.from(bundles)
		.where(
			and(
				eq(bundles.active, true),
				sql`exists (select 1 from bundle_items bi
					where bi.bundle_id = bundles.id and bi.product_id = ${productId})`
			)
		)
		.orderBy(asc(bundles.sort))
		.limit(3);

	const members = await membersFor(rows.map((r) => r.id));
	return rows.map((r) => toView(r, members.get(r.id) ?? [])).filter((b) => b.items.length > 1);
}

export async function listBundles(activeOnly = false): Promise<BundleView[]> {
	const rows = await db
		.select()
		.from(bundles)
		.where(activeOnly ? eq(bundles.active, true) : undefined)
		.orderBy(asc(bundles.sort), asc(bundles.title));
	const members = await membersFor(rows.map((r) => r.id));
	return rows.map((r) => toView(r, members.get(r.id) ?? []));
}

/**
 * Splits the bundle price across its members, largest-remainder style so the
 * parts sum to the bundle price exactly — a naive round leaves a poisha adrift
 * and the cart total stops matching the advertised price.
 */
export function allocatePrices(items: BundleMember[], bundlePrice: number): number[] {
	const worth = items.reduce((n, i) => n + i.unitPrice * i.qty, 0);
	if (worth <= 0) return items.map(() => 0);

	const exact = items.map((i) => (i.unitPrice * i.qty * bundlePrice) / worth);
	const floored = exact.map(Math.floor);
	let remainder = bundlePrice - floored.reduce((a, b) => a + b, 0);

	// Hand the leftover poisha to the lines with the largest fractional part.
	const order = exact
		.map((v, idx) => ({ idx, frac: v - Math.floor(v) }))
		.sort((a, b) => b.frac - a.frac);

	const out = [...floored];
	for (let k = 0; remainder > 0; k = (k + 1) % order.length, remainder--) out[order[k].idx]++;

	// Line totals are per-unit downstream, so divide back out by quantity.
	return out.map((total, idx) => Math.round(total / items[idx].qty));
}

/** Adds every member of a bundle to a cart at its allocated price. */
export async function addBundleToCart(
	cartId: string,
	bundleId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
	const bundle = await getBundle(bundleId);
	if (!bundle || !bundle.items.length) return { ok: false, error: 'That bundle is unavailable.' };
	if (!bundle.inStock) return { ok: false, error: 'Part of that bundle is out of stock.' };

	const prices = allocatePrices(bundle.items, bundle.price);

	await db.transaction(async (tx) => {
		// A bundle is bought as a unit: adding it twice replaces the first copy
		// rather than silently doubling a discounted set.
		await tx
			.delete(cartItems)
			.where(and(eq(cartItems.cartId, cartId), eq(cartItems.bundleId, bundle.id)));

		await tx.insert(cartItems).values(
			bundle.items.map((item, i) => ({
				cartId,
				productId: item.productId,
				variantId: item.variantId,
				bundleId: bundle.id,
				unitPrice: prices[i],
				qty: item.qty
			}))
		);
	});

	return { ok: true };
}

/** Removing any part of a bundle removes the whole set — the price was for the set. */
export const removeBundleFromCart = (cartId: string, bundleId: string) =>
	db.delete(cartItems).where(and(eq(cartItems.cartId, cartId), eq(cartItems.bundleId, bundleId)));
