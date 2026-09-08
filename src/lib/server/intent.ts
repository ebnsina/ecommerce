/**
 * Recording what shoppers want, as distinct from what they bought.
 *
 * Sales figures alone cannot tell "nobody wants this" from "nobody can find
 * it". Views, add-to-carts and searches can, and a search that returns nothing
 * is the clearest signal there is: demand the shop has no answer for.
 *
 * Every write here is fire-and-forget. Analytics must never fail a page load.
 */
import { and, count, desc, eq, gte, inArray, sql } from 'drizzle-orm';
import { db } from './db';
import { searchQueries, productEvents, orderItems, orders, products } from './db/schema';

/** Terms are folded to lower case so "Kettle" and "kettle" are one row. */
export function recordSearch(term: string, results: number, customerId?: string | null) {
	const clean = term.trim().toLowerCase();
	// A single letter is a keystroke, not a question worth counting.
	if (clean.length < 2 || clean.length > 100) return;
	void db
		.insert(searchQueries)
		.values({ term: clean, results, customerId: customerId ?? null })
		.catch(() => {});
}

export function recordProductEvent(productId: string, kind: 'view' | 'cart') {
	void db
		.insert(productEvents)
		.values({ productId, kind })
		.catch(() => {});
}

const since = (days: number) => new Date(Date.now() - days * 86400_000);

/** What people searched for, most first, with how often it found nothing. */
export async function topSearches(days = 30, limit = 20) {
	return db
		.select({
			term: searchQueries.term,
			searches: count(),
			// A term that sometimes finds things and sometimes does not is worth
			// seeing as a proportion rather than a flag.
			empty: sql<number>`sum(case when ${searchQueries.results} = 0 then 1 else 0 end)::int`.as(
				'empty'
			)
		})
		.from(searchQueries)
		.where(gte(searchQueries.createdAt, since(days)))
		.groupBy(searchQueries.term)
		.orderBy(desc(count()))
		.limit(limit);
}

/** Searches that found nothing: demand with no product behind it. */
export async function unmetDemand(days = 30, limit = 20) {
	return db
		.select({ term: searchQueries.term, searches: count() })
		.from(searchQueries)
		.where(and(gte(searchQueries.createdAt, since(days)), eq(searchQueries.results, 0)))
		.groupBy(searchQueries.term)
		.orderBy(desc(count()))
		.limit(limit);
}

/**
 * Interest against sales. A product with many views and few orders is priced
 * wrong, photographed badly or out of stock — not unwanted.
 *
 * Three small grouped queries merged in memory, rather than one product query
 * carrying three correlated subqueries: the joined-up version reads worse, and
 * every column has to be aliased by hand or the driver collapses same-named
 * ones into each other.
 */
export async function interestVsSales(days = 30, limit = 20) {
	const from = since(days);

	const [events, sold] = await Promise.all([
		db
			.select({
				productId: productEvents.productId,
				kind: productEvents.kind,
				n: count()
			})
			.from(productEvents)
			.where(gte(productEvents.createdAt, from))
			.groupBy(productEvents.productId, productEvents.kind),
		db
			.select({
				productId: orderItems.productId,
				units: sql<number>`sum(${orderItems.qty})::int`.as('units')
			})
			.from(orderItems)
			.innerJoin(orders, eq(orders.id, orderItems.orderId))
			.where(
				and(gte(orders.createdAt, from), sql`${orders.status} not in ('cancelled', 'returned')`)
			)
			.groupBy(orderItems.productId)
	]);

	const views = new Map<string, number>();
	const carts = new Map<string, number>();
	for (const e of events) (e.kind === 'cart' ? carts : views).set(e.productId, e.n);
	const units = new Map(sold.map((s) => [s.productId ?? '', Number(s.units)]));

	const seen = [...views.keys()];
	if (!seen.length) return [];

	const rows = await db
		.select({
			id: products.id,
			title: products.title,
			slug: products.slug,
			price: products.price,
			stock: products.stock
		})
		.from(products)
		.where(and(eq(products.status, 'active'), inArray(products.id, seen)));

	return rows
		.map((p) => ({
			...p,
			views: views.get(p.id) ?? 0,
			carts: carts.get(p.id) ?? 0,
			sold: units.get(p.id) ?? 0
		}))
		.sort((a, b) => b.views - a.views)
		.slice(0, limit);
}

/** Units sold and money taken, per product. */
export async function bestSellers(days = 30, limit = 20) {
	const from = since(days);
	return db
		.select({
			id: products.id,
			title: products.title,
			slug: products.slug,
			units: sql<number>`sum(${orderItems.qty})::int`.as('units'),
			revenue: sql<number>`sum(${orderItems.qty} * ${orderItems.unitPrice})::int`.as('revenue')
		})
		.from(orderItems)
		.innerJoin(orders, eq(orders.id, orderItems.orderId))
		.innerJoin(products, eq(products.id, orderItems.productId))
		.where(and(gte(orders.createdAt, from), sql`${orders.status} not in ('cancelled', 'returned')`))
		.groupBy(products.id, products.title, products.slug)
		.orderBy(desc(sql`sum(${orderItems.qty})`))
		.limit(limit);
}

/**
 * How orders end up. In a cash-on-delivery market the return rate is the number
 * that decides whether the shop makes money, because a refused parcel is paid
 * for twice and sold none.
 */
export async function fulfilmentRates(days = 90) {
	const rows = await db
		.select({ status: orders.status, method: orders.paymentMethod, n: count() })
		.from(orders)
		.where(gte(orders.createdAt, since(days)))
		.groupBy(orders.status, orders.paymentMethod);

	const total = rows.reduce((n, r) => n + r.n, 0);
	const of = (pred: (r: (typeof rows)[number]) => boolean) =>
		rows.filter(pred).reduce((n, r) => n + r.n, 0);

	const cod = of((r) => r.method === 'cod');
	const codReturned = of((r) => r.method === 'cod' && r.status === 'returned');

	return {
		total,
		delivered: of((r) => r.status === 'delivered'),
		returned: of((r) => r.status === 'returned'),
		cancelled: of((r) => r.status === 'cancelled'),
		cod,
		// The one that matters here: of the cash-on-delivery parcels sent, how
		// many came back.
		codReturnRate: cod ? codReturned / cod : 0
	};
}

/**
 * Products bought in the same order as this one, most frequent first.
 *
 * Deliberately not a recommender: it is a count of what actually happened,
 * which is explainable to the owner and needs no training, no model and no
 * second service.
 */
export async function boughtTogether(productId: string, limit = 4) {
	return db
		.select({
			id: products.id,
			title: products.title,
			slug: products.slug,
			price: products.price,
			compareAtPrice: products.compareAtPrice,
			rating: products.rating,
			reviewCount: products.reviewCount,
			stock: products.stock,
			hasVariants: products.hasVariants,
			image: sql<string | null>`(select pi.url from product_images pi
				where pi.product_id = products.id order by pi.sort limit 1)`.as('image'),
			orders: sql<number>`count(distinct other.order_id)::int`.as('orders')
		})
		.from(sql`order_items other`)
		.innerJoin(products, sql`products.id = other.product_id`)
		.where(
			sql`other.product_id <> ${productId}
				and products.status = 'active'
				and other.order_id in (
					select oi.order_id from order_items oi where oi.product_id = ${productId}
				)`
		)
		.groupBy(products.id)
		.orderBy(desc(sql`count(distinct other.order_id)`))
		.limit(limit);
}

/**
 * The upsell: what buyers of the things already in this cart also took, minus
 * whatever is in the cart. Same counted-from-orders basis as `boughtTogether`,
 * so it is explainable and needs no model.
 */
export async function alsoBoughtWith(productIds: string[], limit = 3) {
	if (!productIds.length) return [];

	return db
		.select({
			id: products.id,
			title: products.title,
			slug: products.slug,
			price: products.price,
			compareAtPrice: products.compareAtPrice,
			rating: products.rating,
			reviewCount: products.reviewCount,
			stock: products.stock,
			hasVariants: products.hasVariants,
			image: sql<string | null>`(select pi.url from product_images pi
				where pi.product_id = products.id order by pi.sort limit 1)`.as('image'),
			orders: sql<number>`count(distinct other.order_id)::int`.as('orders')
		})
		.from(sql`order_items other`)
		.innerJoin(products, sql`products.id = other.product_id`)
		.where(
			sql`products.status = 'active'
				and (products.has_variants or products.stock > 0)
				and other.product_id not in ${productIds}
				and other.order_id in (
					select oi.order_id from order_items oi where oi.product_id in ${productIds}
				)`
		)
		.groupBy(products.id)
		.orderBy(desc(sql`count(distinct other.order_id)`))
		.limit(limit);
}
