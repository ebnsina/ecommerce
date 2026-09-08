/** Add-to-cart and wishlist-toggle, shared by the cart route and the PDP. */
import { fail, redirect, type RequestEvent } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { db } from './db';
import { wishlist } from './db/schema';
import { getOrCreateCart, addToCart } from './cart';

/**
 * Adds to the cart. `forceTo` lets "Buy now" jump straight to checkout without
 * the page having to flip a hidden field before submitting — that ordering is
 * not guaranteed, so the destination is decided here instead.
 */
async function add(event: RequestEvent, forceTo?: string) {
	const form = await event.request.formData();
	const cart = await getOrCreateCart(event);
	const result = await addToCart(
		cart.id,
		String(form.get('productId') ?? ''),
		String(form.get('variantId') ?? '') || null,
		Math.max(1, Number(form.get('qty') ?? 1))
	);
	if (!result.ok) return fail(400, { error: result.error });

	const to = forceTo ?? String(form.get('redirectTo') ?? '');
	if (to) redirect(303, to);
	return { added: true };
}

export const addAction = (event: RequestEvent) => add(event);
export const buyNowAction = (event: RequestEvent) => add(event, '/checkout');

export async function wishlistAction(event: RequestEvent) {
	const form = await event.request.formData();
	const productId = String(form.get('productId') ?? '');
	const next = String(form.get('redirectTo') ?? '/');

	if (event.locals.user?.kind !== 'customer')
		redirect(303, `/login?next=${encodeURIComponent(next)}`);

	const customerId = event.locals.user.id;
	const [row] = await db
		.select()
		.from(wishlist)
		.where(and(eq(wishlist.customerId, customerId), eq(wishlist.productId, productId)))
		.limit(1);

	if (row) {
		await db
			.delete(wishlist)
			.where(and(eq(wishlist.customerId, customerId), eq(wishlist.productId, productId)));
		return { saved: false };
	}
	await db.insert(wishlist).values({ customerId, productId });
	return { saved: true };
}
