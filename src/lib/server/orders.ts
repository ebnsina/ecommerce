/**
 * Order placement. Runs in one transaction and re-checks stock inside it —
 * the cart page's numbers are always a few seconds stale.
 *
 * Stock is NOT decremented here: COD orders get cancelled constantly, so units
 * are only committed when staff confirm the order (see confirmOrder).
 */
import { and, eq, sql } from 'drizzle-orm';
import { db } from './db';
import {
	orders,
	orderItems,
	orderEvents,
	products,
	variants,
	coupons,
	cartItems
} from './db/schema';
import type { CartLine } from './cart';
import { getSettings } from './settings';

export type Zone = 'inside_dhaka' | 'suburban_dhaka' | 'outside_dhaka';

export async function shippingFor(zone: Zone, subtotal: number) {
	const { delivery } = await getSettings();
	const rule = delivery[zone];
	if (!rule) return 0;
	return subtotal >= rule.freeAbove && rule.freeAbove > 0 ? 0 : rule.charge;
}

export type CouponResult =
	{ ok: true; code: string; discount: number; label: string } | { ok: false; error: string };

/** Who is redeeming, for the per-customer limit. Guests have no account, so
    the phone — which is the account key in this shop anyway — stands in. */
export type Redeemer = { customerId: string | null; phone: string | null };

export async function applyCoupon(
	code: string,
	subtotal: number,
	shipping: number,
	by?: Redeemer
): Promise<CouponResult> {
	const [c] = await db
		.select()
		.from(coupons)
		.where(eq(coupons.code, code.trim().toUpperCase()))
		.limit(1);

	if (!c || !c.active) return { ok: false, error: 'That coupon is not valid.' };

	const now = new Date();
	if (c.startsAt && c.startsAt > now) return { ok: false, error: 'That coupon is not active yet.' };
	if (c.endsAt && c.endsAt < now) return { ok: false, error: 'That coupon has expired.' };
	if (c.usageLimit !== null && c.usedCount >= c.usageLimit)
		return { ok: false, error: 'That coupon has been fully used.' };
	if (subtotal < c.minOrder)
		return {
			ok: false,
			error: `Spend at least ৳${Math.round(c.minOrder / 100)} to use this coupon.`
		};

	// Staff set a per-customer limit in the admin and are entitled to assume it
	// is enforced; before this it was stored and ignored.
	const who = by?.customerId
		? eq(orders.customerId, by.customerId)
		: by?.phone
			? eq(orders.phone, by.phone)
			: null;
	if (who) {
		const [{ n }] = await db
			.select({ n: sql<number>`count(*)::int` })
			.from(orders)
			.where(and(eq(orders.couponCode, c.code), who));
		if (n >= c.perCustomerLimit) return { ok: false, error: 'You have already used this coupon.' };
	}

	const discount =
		c.type === 'percent'
			? Math.round((subtotal * c.value) / 100)
			: c.type === 'fixed'
				? Math.min(c.value, subtotal)
				: shipping;

	return {
		ok: true,
		code: c.code,
		discount,
		label: c.type === 'free_shipping' ? 'Free delivery' : `Coupon ${c.code}`
	};
}

/** 260907-0041 — date plus a per-day counter, readable over the phone. */
async function nextOrderNumber(tx: typeof db) {
	const prefix = new Date().toISOString().slice(2, 10).replace(/-/g, '');
	const [{ n }] = await tx
		.select({ n: sql<number>`count(*)::int` })
		.from(orders)
		.where(sql`${orders.number} like ${prefix + '%'}`);
	return `${prefix}-${String(n + 1).padStart(4, '0')}`;
}

type PlaceInput = {
	cartId: string;
	customerId: string | null;
	lines: CartLine[];
	name: string;
	phone: string;
	address: { zone: Zone; city: string; area?: string; line: string };
	paymentMethod: 'cod' | 'sslcommerz';
	couponCode: string | null;
	note: string | null;
};

export async function placeOrder(
	input: PlaceInput
): Promise<{ ok: true; id: string; number: string } | { ok: false; error: string }> {
	if (!input.lines.length) return { ok: false, error: 'Your cart is empty.' };

	const subtotal = input.lines.reduce((n, l) => n + l.lineTotal, 0);
	const shipping = await shippingFor(input.address.zone, subtotal);

	let discount = 0;
	let couponCode: string | null = null;
	if (input.couponCode) {
		const applied = await applyCoupon(input.couponCode, subtotal, shipping, {
			customerId: input.customerId,
			phone: input.phone
		});
		if (!applied.ok) return { ok: false, error: applied.error };
		discount = applied.discount;
		couponCode = applied.code;
	}

	const total = Math.max(0, subtotal + shipping - discount);

	const { payment } = await getSettings();
	if (input.paymentMethod === 'cod') {
		if (!payment.cod) return { ok: false, error: 'Cash on delivery is unavailable right now.' };
		if (payment.codMaxOrder && total > payment.codMaxOrder)
			return {
				ok: false,
				error: `Orders over ৳${Math.round(payment.codMaxOrder / 100)} need online payment.`
			};
	}

	try {
		return await db.transaction(async (tx) => {
			// Stock is re-read here, inside the transaction — this is the oversell guard.
			for (const line of input.lines) {
				const [row] = line.variantId
					? await tx
							.select({ stock: variants.stock })
							.from(variants)
							.where(eq(variants.id, line.variantId))
					: await tx
							.select({ stock: products.stock })
							.from(products)
							.where(eq(products.id, line.productId));
				if (!row || row.stock < line.qty)
					throw new Error(`${line.title} only has ${row?.stock ?? 0} left.`);
			}

			const number = await nextOrderNumber(tx as unknown as typeof db);
			const [order] = await tx
				.insert(orders)
				.values({
					number,
					customerId: input.customerId,
					name: input.name,
					phone: input.phone,
					address: input.address,
					zone: input.address.zone,
					subtotal,
					discount,
					shipping,
					total,
					couponCode,
					paymentMethod: input.paymentMethod,
					paymentStatus: 'unpaid',
					status: 'pending',
					note: input.note
				})
				.returning();

			await tx.insert(orderItems).values(
				input.lines.map((l) => ({
					orderId: order.id,
					productId: l.productId,
					variantId: l.variantId,
					title: l.title,
					optionLabel: l.optionLabel,
					image: l.image,
					unitPrice: l.unitPrice,
					qty: l.qty
				}))
			);

			await tx.insert(orderEvents).values({
				orderId: order.id,
				toStatus: 'pending',
				note: 'Order placed by the customer'
			});

			// The limit is checked by the increment itself, not by the earlier read:
			// simultaneous checkouts all see the same count and would otherwise all
			// pass. Same shape as the stock guard above.
			if (couponCode) {
				const bumped = await tx
					.update(coupons)
					.set({ usedCount: sql`${coupons.usedCount} + 1` })
					.where(
						and(
							eq(coupons.code, couponCode),
							sql`${coupons.usageLimit} is null or ${coupons.usedCount} < ${coupons.usageLimit}`
						)
					)
					.returning({ id: coupons.id });
				if (!bumped.length) throw new Error('That coupon has been fully used.');
			}

			await tx.delete(cartItems).where(eq(cartItems.cartId, input.cartId));

			return { ok: true as const, id: order.id, number };
		});
	} catch (e) {
		return { ok: false, error: (e as Error).message };
	}
}

/** Staff confirmed the order on the phone — this is where stock is committed. */
export async function confirmOrder(orderId: string, actorId: string | null) {
	return db.transaction(async (tx) => {
		const [order] = await tx.select().from(orders).where(eq(orders.id, orderId)).limit(1);
		if (!order || order.status !== 'pending')
			return { ok: false as const, error: 'Order is not pending.' };

		const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, orderId));
		for (const item of items) {
			if (item.variantId) {
				const [v] = await tx
					.update(variants)
					.set({ stock: sql`${variants.stock} - ${item.qty}` })
					.where(and(eq(variants.id, item.variantId), sql`${variants.stock} >= ${item.qty}`))
					.returning();
				if (!v) return { ok: false as const, error: `${item.title} is out of stock.` };
			} else if (item.productId) {
				const [p] = await tx
					.update(products)
					.set({
						stock: sql`${products.stock} - ${item.qty}`,
						soldCount: sql`${products.soldCount} + ${item.qty}`
					})
					.where(and(eq(products.id, item.productId), sql`${products.stock} >= ${item.qty}`))
					.returning();
				if (!p) return { ok: false as const, error: `${item.title} is out of stock.` };
			}
		}

		await tx.update(orders).set({ status: 'confirmed' }).where(eq(orders.id, orderId));
		await tx.insert(orderEvents).values({
			orderId,
			fromStatus: 'pending',
			toStatus: 'confirmed',
			note: 'Confirmed with the customer',
			actorId
		});
		return { ok: true as const };
	});
}
