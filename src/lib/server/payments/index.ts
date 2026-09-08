/**
 * Marking an order paid. One place, because it is the only thing in the shop
 * where getting it wrong costs real money.
 */
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { orders, orderEvents } from '../db/schema';
import { validatePayment } from './sslcommerz';

export { createSession, paymentConfigured, isSandbox } from './sslcommerz';

/**
 * Confirms a payment against the gateway and records it.
 *
 * Safe to call repeatedly: the redirect and the IPN both land here, often at
 * the same moment, and an order that is already paid is left alone. The amount
 * is checked, so a tampered redirect claiming a paid ৳10 order cannot mark a
 * ৳10,000 one settled.
 */
export async function settleOrder(valId: string, orderNumber: string) {
	const [order] = await db.select().from(orders).where(eq(orders.number, orderNumber)).limit(1);
	if (!order) return { ok: false as const, error: 'That order could not be found.' };
	if (order.paymentStatus === 'paid') return { ok: true as const, order, alreadyPaid: true };

	const result = await validatePayment(valId);
	if (!result.ok)
		return { ok: false as const, error: result.reason ?? 'The bank did not confirm that payment.' };

	if (result.amount !== order.total)
		return {
			ok: false as const,
			error: 'The amount paid does not match the order. Nothing has been marked as paid.'
		};

	await db
		.update(orders)
		.set({ paymentStatus: 'paid', status: order.status === 'pending' ? 'confirmed' : order.status })
		.where(eq(orders.id, order.id));

	await db.insert(orderEvents).values({
		orderId: order.id,
		fromStatus: order.status,
		toStatus: order.status === 'pending' ? 'confirmed' : order.status,
		note: `Paid online${result.cardType ? ` by ${result.cardType}` : ''} · ${result.transactionId}`
	});

	return { ok: true as const, order, alreadyPaid: false };
}
