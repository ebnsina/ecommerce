/**
 * Refreshes courier status for parcels in transit and advances the pipeline
 * when the courier's wording is unambiguous.
 *
 * Point a scheduler at this every 30–60 minutes. It is protected by a shared
 * secret rather than a session, because a scheduler has no session.
 */
import { json, error } from '@sveltejs/kit';
import { and, eq, isNotNull, inArray } from 'drizzle-orm';
import { env } from '$env/dynamic/private';
import { safeEqual } from '$lib/server/safeEqual';
import { db } from '$lib/server/db';
import { orders, orderEvents } from '$lib/server/db/schema';
import { couriers, pipelineStatusFor, type CourierKey } from '$lib/server/couriers';
import { sendSms } from '$lib/server/sms';
import type { RequestHandler } from './$types';

const byLabel = (label: string | null): CourierKey | null => {
	const key = label?.toLowerCase();
	return key === 'steadfast' || key === 'pathao' ? key : null;
};

const run: RequestHandler = async ({ request }) => {
	const secret = env.CRON_SECRET;
	if (!secret) error(503, 'CRON_SECRET is not set');
	if (!safeEqual(request.headers.get('authorization') ?? '', `Bearer ${secret}`))
		error(403, 'Bad secret');

	// Only parcels that are actually out: anything delivered or returned is done.
	const inFlight = await db
		.select()
		.from(orders)
		.where(and(isNotNull(orders.consignmentId), inArray(orders.status, ['shipped', 'packed'])))
		.limit(200);

	let checked = 0;
	let advanced = 0;

	for (const order of inFlight) {
		const key = byLabel(order.courier);
		const adapter = key ? couriers[key] : null;
		if (!adapter?.configured()) continue;

		let courierStatus: string | null;
		try {
			courierStatus = await adapter.status(order.consignmentId!);
		} catch {
			continue; // one unreachable parcel must not stop the batch
		}
		checked++;
		if (!courierStatus) continue;

		await db
			.update(orders)
			.set({ courierStatus, courierSyncedAt: new Date() })
			.where(eq(orders.id, order.id));

		const next = pipelineStatusFor(courierStatus);
		if (!next || next === order.status) continue;

		await db
			.update(orders)
			.set({
				status: next,
				// A delivered cash-on-delivery parcel means the money was collected.
				...(next === 'delivered' && order.paymentMethod === 'cod'
					? { paymentStatus: 'paid' as const }
					: {})
			})
			.where(eq(orders.id, order.id));

		await db.insert(orderEvents).values({
			orderId: order.id,
			fromStatus: order.status,
			toStatus: next,
			note: `${order.courier} reported "${courierStatus}"`
		});
		advanced++;

		if (next === 'returned')
			await sendSms(
				order.phone,
				`Your order ${order.number} came back to us. Call us if you still want it.`
			);
	}

	return json({ inFlight: inFlight.length, checked, advanced });
};

/* Either verb: most schedulers issue a GET, and POST is there for triggering
   a run by hand. The secret goes in an Authorization: Bearer header. */
export const GET = run;
export const POST = run;
