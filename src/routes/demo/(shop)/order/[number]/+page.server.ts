import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { orders, orderItems } from '$lib/server/db/schema';
import { ownsOrder } from '$lib/server/orderAccess';
import type { PageServerLoad } from './$types';

/** Guests reach this straight after checkout, so it is not behind a sign-in —
    but the page carries the buyer's name, mobile and address, and the order
    number is a per-day counter anyone can count through. `ownsOrder` is what
    makes it the buyer's page rather than the whole customer list. */
export const load: PageServerLoad = async (event) => {
	const { params } = event;
	const [order] = await db.select().from(orders).where(eq(orders.number, params.number)).limit(1);
	// 404, not 403: a refusal would confirm the number exists.
	if (!order || !ownsOrder(event, order)) error(404, 'Order not found');

	const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
	return {
		order,
		items,
		// The browser half of the purchase event. The order id is what the
		// server-side event is keyed on too, which is what stops double counting.
		purchase: { orderId: order.id, orderNumber: order.number, value: order.total }
	};
};
