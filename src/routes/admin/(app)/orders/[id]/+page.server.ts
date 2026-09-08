import { error, fail } from '@sveltejs/kit';
import { asc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { orders, orderItems, orderEvents, adminUsers } from '$lib/server/db/schema';
import { confirmOrder } from '$lib/server/orders';
import { sendSms } from '$lib/server/sms';
import type { Actions, PageServerLoad } from './$types';

/** Which transitions are legal from each state — the pipeline in one place. */
const NEXT: Record<string, string[]> = {
	pending: ['confirmed', 'cancelled'],
	confirmed: ['packed', 'cancelled'],
	packed: ['shipped', 'cancelled'],
	shipped: ['delivered', 'returned'],
	delivered: [],
	returned: [],
	cancelled: []
};

export const load: PageServerLoad = async ({ params }) => {
	const [order] = await db.select().from(orders).where(eq(orders.id, params.id)).limit(1);
	if (!order) error(404, 'Order not found');

	const [items, events] = await Promise.all([
		db.select().from(orderItems).where(eq(orderItems.orderId, order.id)),
		db
			.select({
				id: orderEvents.id,
				fromStatus: orderEvents.fromStatus,
				toStatus: orderEvents.toStatus,
				note: orderEvents.note,
				createdAt: orderEvents.createdAt,
				actor: adminUsers.name
			})
			.from(orderEvents)
			.leftJoin(adminUsers, eq(adminUsers.id, orderEvents.actorId))
			.where(eq(orderEvents.orderId, order.id))
			.orderBy(asc(orderEvents.createdAt))
	]);

	return { order, items, events, next: NEXT[order.status] ?? [] };
};

const SMS: Record<string, (n: string) => string | null> = {
	confirmed: (n) => `Your order ${n} is confirmed and being prepared. Thank you!`,
	shipped: (n) => `Your order ${n} is on the way. Please keep your phone reachable.`,
	delivered: () => null,
	cancelled: (n) => `Your order ${n} has been cancelled. Contact us if this is a mistake.`
};

export const actions: Actions = {
	transition: async ({ request, params, locals }) => {
		const form = await request.formData();
		const to = String(form.get('to') ?? '');
		const note = String(form.get('note') ?? '').trim() || null;
		const actorId = locals.user?.kind === 'admin' ? locals.user.id : null;

		const [order] = await db.select().from(orders).where(eq(orders.id, params.id)).limit(1);
		if (!order) return fail(404, { error: 'Order not found.' });
		if (!(NEXT[order.status] ?? []).includes(to))
			return fail(400, { error: `Cannot move a ${order.status} order to ${to}.` });

		// Confirming is the one transition that touches stock.
		if (to === 'confirmed') {
			const result = await confirmOrder(order.id, actorId);
			if (!result.ok) return fail(400, { error: result.error });
		} else {
			await db
				.update(orders)
				.set({ status: to as 'packed' })
				.where(eq(orders.id, order.id));
			await db.insert(orderEvents).values({
				orderId: order.id,
				fromStatus: order.status,
				toStatus: to as 'packed',
				note,
				actorId
			});
		}

		if (to === 'delivered' && order.paymentMethod === 'cod')
			await db.update(orders).set({ paymentStatus: 'paid' }).where(eq(orders.id, order.id));

		const message = SMS[to]?.(order.number);
		if (message) await sendSms(order.phone, message);

		return { ok: true };
	},

	courier: async ({ request, params }) => {
		const form = await request.formData();
		await db
			.update(orders)
			.set({
				courier: String(form.get('courier') ?? '').trim() || null,
				consignmentId: String(form.get('consignmentId') ?? '').trim() || null
			})
			.where(eq(orders.id, params.id));
		return { ok: true };
	}
};
