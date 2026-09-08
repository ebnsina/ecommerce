import { desc, eq, count } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { orders, wishlist, addresses } from '$lib/server/db/schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const customerId = locals.user!.id;
	const [recent, [saved], [addressCount]] = await Promise.all([
		db
			.select({
				id: orders.id,
				number: orders.number,
				status: orders.status,
				total: orders.total,
				createdAt: orders.createdAt
			})
			.from(orders)
			.where(eq(orders.customerId, customerId))
			.orderBy(desc(orders.createdAt))
			.limit(5),
		db.select({ n: count() }).from(wishlist).where(eq(wishlist.customerId, customerId)),
		db.select({ n: count() }).from(addresses).where(eq(addresses.customerId, customerId))
	]);

	return { recent, wishlistCount: saved?.n ?? 0, addressCount: addressCount?.n ?? 0 };
};
