import { desc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { orders } from '$lib/server/db/schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => ({
	list: await db
		.select()
		.from(orders)
		.where(eq(orders.customerId, locals.user!.id))
		.orderBy(desc(orders.createdAt))
});
