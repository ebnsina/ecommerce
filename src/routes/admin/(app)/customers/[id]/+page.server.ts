import { error } from '@sveltejs/kit';
import { desc, eq, sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { customers, orders, addresses } from '$lib/server/db/schema';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const [customer] = await db.select().from(customers).where(eq(customers.id, params.id)).limit(1);
	if (!customer) error(404, 'Customer not found');

	const [history, saved, [stats]] = await Promise.all([
		db
			.select()
			.from(orders)
			.where(eq(orders.customerId, customer.id))
			.orderBy(desc(orders.createdAt)),
		db.select().from(addresses).where(eq(addresses.customerId, customer.id)),
		db
			.select({
				total: sql<number>`count(*)::int`,
				delivered: sql<number>`count(*) filter (where ${orders.status} = 'delivered')::int`,
				returned: sql<number>`count(*) filter (where ${orders.status} = 'returned')::int`,
				cancelled: sql<number>`count(*) filter (where ${orders.status} = 'cancelled')::int`,
				spent: sql<number>`coalesce(sum(${orders.total}) filter (where ${orders.status} = 'delivered'), 0)::int`
			})
			.from(orders)
			.where(eq(orders.customerId, customer.id))
	]);

	return { customer, history, addresses: saved, stats };
};

export const actions: Actions = {
	save: async ({ request, params }) => {
		const f = await request.formData();
		await db
			.update(customers)
			.set({
				name: String(f.get('name') ?? '').trim() || null,
				email: String(f.get('email') ?? '').trim() || null,
				notes: String(f.get('notes') ?? '').trim() || null,
				tags: String(f.get('tags') ?? '')
					.split(',')
					.map((t) => t.trim().toLowerCase())
					.filter(Boolean)
			})
			.where(eq(customers.id, params.id));
		return { ok: true };
	}
};
