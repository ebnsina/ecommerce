import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { orders, orderItems } from '$lib/server/db/schema';
import { getSettings } from '$lib/server/settings';
import type { PageServerLoad } from './$types';

/** Sits outside the (app) group, so it renders without the admin chrome. */
export const load: PageServerLoad = async ({ params, url }) => {
	const [order] = await db.select().from(orders).where(eq(orders.id, params.id)).limit(1);
	if (!order) error(404, 'Order not found');

	const [items, settings] = await Promise.all([
		db.select().from(orderItems).where(eq(orderItems.orderId, order.id)),
		getSettings()
	]);

	const format = url.searchParams.get('format') === 'label' ? 'label' : 'invoice';
	return { order, items, settings, format };
};
