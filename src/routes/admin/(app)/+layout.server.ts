import { desc, eq, sql, count } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { orders, products } from '$lib/server/db/schema';
import { getSettings } from '$lib/server/settings';
import { normalizeTheme, themeCss } from '$lib/theme';
import type { LayoutServerLoad } from './$types';

/** Notifications are derived from live state — nothing to mark as read, nothing to store. */
export const load: LayoutServerLoad = async () => {
	const settings = await getSettings();

	const [pending, lowStock, pendingCount] = await Promise.all([
		db
			.select({
				id: orders.id,
				number: orders.number,
				name: orders.name,
				createdAt: orders.createdAt
			})
			.from(orders)
			.where(eq(orders.status, 'pending'))
			.orderBy(desc(orders.createdAt))
			.limit(5),

		db
			.select({ id: products.id, title: products.title, stock: products.stock })
			.from(products)
			.where(sql`${products.stock} <= 5 and ${products.status} = 'active'`)
			.orderBy(products.stock)
			.limit(5),

		db.select({ n: count() }).from(orders).where(eq(orders.status, 'pending'))
	]);

	return {
		themeCss: themeCss(normalizeTheme(settings.theme)),
		notifications: {
			pending,
			lowStock,
			total: (pendingCount[0]?.n ?? 0) + lowStock.length
		}
	};
};
