import { and, desc, eq, ilike, or } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { orders } from '$lib/server/db/schema';
import { toCsv } from '$lib/csv';
import type { RequestHandler } from './$types';

const COLUMNS = [
	'number',
	'date',
	'name',
	'phone',
	'district',
	'area',
	'address',
	'zone',
	'status',
	'payment_method',
	'payment_status',
	'courier',
	'tracking_code',
	'subtotal',
	'discount',
	'shipping',
	'total'
];

const tk = (poisha: number) => (poisha / 100).toFixed(2);

/** Exports whatever the list is filtered to, so "export what I see" holds. */
export const GET: RequestHandler = async ({ url }) => {
	const q = url.searchParams.get('q')?.trim() ?? '';
	const status = url.searchParams.get('status') ?? '';

	const rows = await db
		.select()
		.from(orders)
		.where(
			and(
				q
					? or(
							ilike(orders.number, `%${q}%`),
							ilike(orders.phone, `%${q}%`),
							ilike(orders.name, `%${q}%`)
						)
					: undefined,
				status ? eq(orders.status, status as 'pending') : undefined
			)
		)
		.orderBy(desc(orders.createdAt))
		// A hard ceiling: an unbounded export is how an admin page times out.
		.limit(5000);

	const csv = toCsv(
		COLUMNS,
		rows.map((o) => ({
			number: o.number,
			date: new Date(o.createdAt).toISOString().slice(0, 10),
			name: o.name,
			phone: o.phone,
			district: o.address.city,
			area: o.address.area ?? '',
			address: o.address.line,
			zone: o.zone,
			status: o.status,
			payment_method: o.paymentMethod,
			payment_status: o.paymentStatus,
			courier: o.courier ?? '',
			tracking_code: o.trackingCode ?? '',
			subtotal: tk(o.subtotal),
			discount: tk(o.discount),
			shipping: tk(o.shipping),
			total: tk(o.total)
		}))
	);

	const stamp = new Date().toISOString().slice(0, 10);
	return new Response('﻿' + csv, {
		headers: {
			// BOM so Excel opens Bangla names as UTF-8 instead of mojibake.
			'content-type': 'text/csv; charset=utf-8',
			'content-disposition': `attachment; filename="orders-${stamp}.csv"`
		}
	});
};
