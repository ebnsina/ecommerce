import { fail, redirect } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { cartItems } from '$lib/server/db/schema';
import { findCart, getLines, summarise } from '$lib/server/cart';
import { addAction, wishlistAction } from '$lib/server/cart-actions';
import { alsoBoughtWith } from '$lib/server/intent';
import { addBundleToCart, removeBundleFromCart } from '$lib/server/bundles';
import { getOrCreateCart } from '$lib/server/cart';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const cart = await findCart(event);
	const lines = cart ? await getLines(cart.id) : [];

	// Suggestions come from what buyers of these items also took. An empty cart
	// gets none: there is nothing to base them on.
	const upsell = await alsoBoughtWith([...new Set(lines.map((l) => l.productId))]);

	return { lines, upsell, ...summarise(lines) };
};

export const actions: Actions = {
	add: addAction,

	addBundle: async (event) => {
		const form = await event.request.formData();
		const cart = await getOrCreateCart(event);
		const result = await addBundleToCart(cart.id, String(form.get('bundleId') ?? ''));
		if (!result.ok) return fail(400, { error: result.error });

		const to = String(form.get('redirectTo') ?? '');
		if (to) redirect(303, to);
		return { ok: true };
	},

	removeBundle: async (event) => {
		const cart = await findCart(event);
		if (cart)
			await removeBundleFromCart(
				cart.id,
				String((await event.request.formData()).get('bundleId') ?? '')
			);
		return { ok: true };
	},

	setQty: async (event) => {
		const form = await event.request.formData();
		const id = String(form.get('id') ?? '');
		const qty = Number(form.get('qty') ?? 1);
		const cart = await findCart(event);
		if (!cart) return fail(400, { error: 'Your cart has expired.' });

		/* The stepper on a product card posts here from wherever the shopper is
		   standing, so honour a return path the way `add` does — without it, a
		   shopper with JavaScript off is dropped onto the cart page every time
		   they change their mind about how much rice they want. */
		const back = String(form.get('redirectTo') ?? '');

		if (qty <= 0) {
			await db.delete(cartItems).where(and(eq(cartItems.id, id), eq(cartItems.cartId, cart.id)));
			if (back) redirect(303, back);
			return { ok: true };
		}

		// Re-read stock: it can move between page load and this click.
		const lines = await getLines(cart.id);
		const line = lines.find((l) => l.id === id);
		if (!line) return fail(404, { error: 'That item is no longer in your cart.' });
		if (qty > line.stock) return fail(400, { error: `Only ${line.stock} of ${line.title} left.` });

		await db.update(cartItems).set({ qty }).where(eq(cartItems.id, id));
		if (back) redirect(303, back);
		return { ok: true };
	},

	remove: async (event) => {
		const id = String((await event.request.formData()).get('id') ?? '');
		const cart = await findCart(event);
		if (cart)
			await db.delete(cartItems).where(and(eq(cartItems.id, id), eq(cartItems.cartId, cart.id)));
		return { ok: true };
	},

	wishlist: wishlistAction
};
