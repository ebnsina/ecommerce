import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { orders, orderItems } from '$lib/server/db/schema';
import { getSettings } from '$lib/server/settings';
import { purchaseEventId } from '$lib/server/meta';
import type { PageServerLoad } from './$types';

/** Guests reach this straight after checkout, so it is readable by order number.
    Nothing sensitive beyond what the buyer just typed is shown. */
export const load: PageServerLoad = async ({ params }) => {
	const [order] = await db.select().from(orders).where(eq(orders.number, params.number)).limit(1);
	if (!order) error(404, 'Order not found');

	const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
	const settings = await getSettings();
	return {
		order,
		items,
		// The browser half of the Purchase event. Same id as the server-side one,
		// so Meta counts the order once however many of the two arrive.
		purchase: settings.analytics?.metaPixelId
			? { eventId: purchaseEventId(order.id), value: order.total }
			: null
	};
};
