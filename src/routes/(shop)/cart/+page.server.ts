import { fail, redirect } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { cartItems } from '$lib/server/db/schema';
import { findCart, getLines, summarise } from '$lib/server/cart';
import { addAction, wishlistAction } from '$lib/server/cart-actions';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const cart = await findCart(event);
	const lines = cart ? await getLines(cart.id) : [];
	return { lines, ...summarise(lines) };
};

export const actions: Actions = {
	add: addAction,

	setQty: async (event) => {
		const form = await event.request.formData();
		const id = String(form.get('id') ?? '');
		const qty = Number(form.get('qty') ?? 1);
		const cart = await findCart(event);
		if (!cart) return fail(400, { error: 'Your cart has expired.' });

		if (qty <= 0) {
			await db.delete(cartItems).where(and(eq(cartItems.id, id), eq(cartItems.cartId, cart.id)));
			return { ok: true };
		}

		// Re-read stock: it can move between page load and this click.
		const lines = await getLines(cart.id);
		const line = lines.find((l) => l.id === id);
		if (!line) return fail(404, { error: 'That item is no longer in your cart.' });
		if (qty > line.stock) return fail(400, { error: `Only ${line.stock} of ${line.title} left.` });

		await db.update(cartItems).set({ qty }).where(eq(cartItems.id, id));
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
