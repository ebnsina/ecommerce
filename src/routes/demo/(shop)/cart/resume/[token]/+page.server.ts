import { redirect, error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { carts } from '$lib/server/db/schema';
import { adoptCart, getLines } from '$lib/server/cart';
import type { PageServerLoad } from './$types';

/**
 * The link in a cart reminder. The token is the cart's own opaque cookie value,
 * so the shopper lands back on their cart from any device — no login, and
 * nothing but their own cart is reachable.
 */
export const load: PageServerLoad = async (event) => {
	const [cart] = await db.select().from(carts).where(eq(carts.token, event.params.token)).limit(1);
	if (!cart) error(404, 'That link has expired.');

	adoptCart(event, cart.token);
	// An emptied cart means they already ordered — send them somewhere useful.
	redirect(303, (await getLines(cart.id)).length ? '/demo/checkout' : '/');
};
