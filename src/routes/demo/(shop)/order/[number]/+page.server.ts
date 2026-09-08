import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { orders, orderItems } from '$lib/server/db/schema';
import type { PageServerLoad } from './$types';

/** Guests reach this straight after checkout, so it is readable by order number.
    Nothing sensitive beyond what the buyer just typed is shown. */
export const load: PageServerLoad = async ({ params }) => {
	const [order] = await db.select().from(orders).where(eq(orders.number, params.number)).limit(1);
	if (!order) error(404, 'Order not found');

	const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
	return {
		order,
		items,
		// The browser half of the purchase event. The order id is what the
		// server-side event is keyed on too, which is what stops double counting.
		purchase: { orderId: order.id, orderNumber: order.number, value: order.total }
	};
};
