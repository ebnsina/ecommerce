import { error, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { orders } from '$lib/server/db/schema';
import { settleOrder } from '$lib/server/payments';
import { ownsOrder } from '$lib/server/orderAccess';
import type { PageServerLoad } from './$types';

/**
 * Where the gateway sends the shopper back to. All three outcomes land here.
 *
 * On success the payment is confirmed with the gateway before anything is
 * shown — the shopper arriving at this URL proves nothing on its own.
 */
export const load: PageServerLoad = async (event) => {
	const { params, url } = event;
	const [order] = await db
		.select({
			id: orders.id,
			number: orders.number,
			customerId: orders.customerId,
			total: orders.total,
			paymentStatus: orders.paymentStatus
		})
		.from(orders)
		.where(eq(orders.number, params.number))
		.limit(1);

	if (!order || !ownsOrder(event, order)) error(404, 'Order not found');

	if (params.status === 'success') {
		// The gateway posts val_id back on the redirect; the IPN may already have
		// settled it, in which case this is a no-op.
		const valId = url.searchParams.get('val_id');
		if (valId) await settleOrder(valId, params.number);

		const [fresh] = await db
			.select({ paymentStatus: orders.paymentStatus })
			.from(orders)
			.where(eq(orders.id, order.id))
			.limit(1);

		// Paid orders go to the ordinary confirmation page — one place that shows
		// an order, however it was paid for.
		if (fresh?.paymentStatus === 'paid') redirect(303, `/demo/order/${order.number}`);

		return { order, outcome: 'pending' as const };
	}

	const outcome: 'cancelled' | 'failed' = params.status === 'cancelled' ? 'cancelled' : 'failed';
	return { order, outcome };
};
