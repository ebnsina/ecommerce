/**
 * Server-side cart. A cookie holds an opaque token; the rows live in Postgres so
 * a COD order can be reconstructed and stock checked at checkout.
 */
import { randomBytes } from 'node:crypto';
import { and, eq, sql } from 'drizzle-orm';
import type { RequestEvent } from '@sveltejs/kit';
import { db } from './db';
import { carts, cartItems, products, variants, productImages } from './db/schema';

const COOKIE = 'cart';
const DAYS = 60;

export type CartLine = {
	id: string;
	productId: string;
	variantId: string | null;
	slug: string;
	title: string;
	optionLabel: string | null;
	image: string | null;
	unitPrice: number;
	compareAtPrice: number | null;
	qty: number;
	stock: number;
	lineTotal: number;
};

/** Finds the cart for this visitor, creating one only when something is added. */
export async function findCart(event: RequestEvent) {
	const token = event.cookies.get(COOKIE);
	const customerId = event.locals.user?.kind === 'customer' ? event.locals.user.id : null;

	if (customerId) {
		const [byCustomer] = await db
			.select()
			.from(carts)
			.where(eq(carts.customerId, customerId))
			.limit(1);
		if (byCustomer) return byCustomer;
	}
	if (!token) return null;
	const [row] = await db.select().from(carts).where(eq(carts.token, token)).limit(1);
	return row ?? null;
}

export async function getOrCreateCart(event: RequestEvent) {
	const existing = await findCart(event);
	if (existing) return existing;

	const token = event.cookies.get(COOKIE) ?? randomBytes(18).toString('base64url');
	event.cookies.set(COOKIE, token, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: !import.meta.env.DEV,
		maxAge: DAYS * 86400
	});

	const [row] = await db
		.insert(carts)
		.values({
			token,
			customerId: event.locals.user?.kind === 'customer' ? event.locals.user.id : null
		})
		.returning();
	return row;
}

/** Called after a customer signs in — folds the guest cart into theirs. */
export async function mergeGuestCart(event: RequestEvent, customerId: string) {
	const token = event.cookies.get(COOKIE);
	if (!token) return;

	const [guest] = await db.select().from(carts).where(eq(carts.token, token)).limit(1);
	if (!guest || guest.customerId === customerId) return;

	const [own] = await db.select().from(carts).where(eq(carts.customerId, customerId)).limit(1);
	if (!own) {
		await db.update(carts).set({ customerId }).where(eq(carts.id, guest.id));
		return;
	}

	const lines = await db.select().from(cartItems).where(eq(cartItems.cartId, guest.id));
	for (const line of lines) {
		await db
			.insert(cartItems)
			.values({ ...line, id: undefined, cartId: own.id })
			.onConflictDoUpdate({
				target: [cartItems.cartId, cartItems.productId, cartItems.variantId],
				set: { qty: sql`${cartItems.qty} + ${line.qty}` }
			});
	}
	await db.delete(carts).where(eq(carts.id, guest.id));
}

export async function getLines(cartId: string): Promise<CartLine[]> {
	const rows = await db
		.select({
			id: cartItems.id,
			productId: cartItems.productId,
			variantId: cartItems.variantId,
			qty: cartItems.qty,
			slug: products.slug,
			title: products.title,
			productPrice: products.price,
			productCompareAt: products.compareAtPrice,
			productStock: products.stock,
			status: products.status,
			variantPrice: variants.price,
			variantCompareAt: variants.compareAtPrice,
			variantStock: variants.stock,
			variantOptions: variants.optionValues,
			variantImage: variants.image,
			image: sql<string | null>`(select url from ${productImages}
				where ${productImages.productId} = ${products.id} order by sort limit 1)`
		})
		.from(cartItems)
		.innerJoin(products, eq(products.id, cartItems.productId))
		.leftJoin(variants, eq(variants.id, cartItems.variantId))
		.where(eq(cartItems.cartId, cartId));

	return rows
		.filter((r) => r.status === 'active')
		.map((r) => {
			const unitPrice = r.variantPrice ?? r.productPrice;
			const stock = r.variantId ? (r.variantStock ?? 0) : r.productStock;
			return {
				id: r.id,
				productId: r.productId,
				variantId: r.variantId,
				slug: r.slug,
				title: r.title,
				optionLabel: r.variantOptions ? Object.values(r.variantOptions).join(' / ') : null,
				image: r.variantImage ?? r.image,
				unitPrice,
				compareAtPrice: r.variantCompareAt ?? r.productCompareAt,
				qty: r.qty,
				stock,
				lineTotal: unitPrice * r.qty
			};
		});
}

export const summarise = (lines: CartLine[]) => ({
	count: lines.reduce((n, l) => n + l.qty, 0),
	subtotal: lines.reduce((n, l) => n + l.lineTotal, 0),
	/** Lines the shopper must fix before checkout. */
	problems: lines.filter((l) => l.qty > l.stock)
});

/** Adds or bumps a line, clamped to available stock. Returns the clamp reason. */
export async function addToCart(
	cartId: string,
	productId: string,
	variantId: string | null,
	qty: number
): Promise<{ ok: true } | { ok: false; error: string }> {
	const [product] = await db.select().from(products).where(eq(products.id, productId)).limit(1);
	if (!product || product.status !== 'active')
		return { ok: false, error: 'That product is unavailable.' };

	let stock = product.stock;
	if (product.hasVariants) {
		if (!variantId) return { ok: false, error: 'Choose the options first.' };
		const [v] = await db
			.select()
			.from(variants)
			.where(and(eq(variants.id, variantId), eq(variants.productId, productId)))
			.limit(1);
		if (!v || !v.active) return { ok: false, error: 'That combination is unavailable.' };
		stock = v.stock;
	} else {
		variantId = null;
	}

	const [existing] = await db
		.select()
		.from(cartItems)
		.where(
			and(
				eq(cartItems.cartId, cartId),
				eq(cartItems.productId, productId),
				variantId ? eq(cartItems.variantId, variantId) : sql`${cartItems.variantId} is null`
			)
		)
		.limit(1);

	const wanted = (existing?.qty ?? 0) + qty;
	if (stock <= 0) return { ok: false, error: 'Out of stock.' };
	if (wanted > stock)
		return {
			ok: false,
			error: `Only ${stock} left — your cart already has ${existing?.qty ?? 0}.`
		};

	if (existing) {
		await db.update(cartItems).set({ qty: wanted }).where(eq(cartItems.id, existing.id));
	} else {
		await db.insert(cartItems).values({ cartId, productId, variantId, qty });
	}
	await db.update(carts).set({ updatedAt: new Date() }).where(eq(carts.id, cartId));
	return { ok: true };
}
