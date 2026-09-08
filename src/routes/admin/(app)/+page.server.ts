import { sql, gte, desc, count } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { orders, products, customers } from '$lib/server/db/schema';
import type { PageServerLoad } from './$types';

const DAYS = 14;

export const load: PageServerLoad = async () => {
	const since = new Date(Date.now() - (DAYS - 1) * 864e5);
	since.setHours(0, 0, 0, 0);

	const [daily, byStatus, totals, lowStock, recent] = await Promise.all([
		// orders + revenue per day, gap-filled below
		db
			.select({
				day: sql<string>`to_char(${orders.createdAt}, 'YYYY-MM-DD')`,
				orders: count(),
				revenue: sql<number>`coalesce(sum(${orders.total}), 0)::int`
			})
			.from(orders)
			.where(gte(orders.createdAt, since))
			.groupBy(sql`1`),

		db.select({ status: orders.status, n: count() }).from(orders).groupBy(orders.status),

		db
			.select({
				orders: count(),
				revenue: sql<number>`coalesce(sum(case when ${orders.status} <> 'cancelled'
					then ${orders.total} else 0 end), 0)::int`,
				pending: sql<number>`count(*) filter (where ${orders.status} = 'pending')::int`
			})
			.from(orders),

		db
			.select({ n: count() })
			.from(products)
			.where(sql`${products.stock} <= 5 and ${products.status} = 'active'`),

		db
			.select({
				id: orders.id,
				number: orders.number,
				name: orders.name,
				total: orders.total,
				status: orders.status,
				createdAt: orders.createdAt
			})
			.from(orders)
			.orderBy(desc(orders.createdAt))
			.limit(6)
	]);

	const [customerCount] = await db.select({ n: count() }).from(customers);

	// Gap-fill so a quiet day is a zero, not a missing point (a gapped line lies).
	const map = new Map(daily.map((d) => [d.day, d]));
	const series = Array.from({ length: DAYS }, (_, i) => {
		const d = new Date(since.getTime() + i * 864e5);
		const key = d.toISOString().slice(0, 10);
		const row = map.get(key);
		return {
			label: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
			orders: row?.orders ?? 0,
			revenue: row?.revenue ?? 0
		};
	});

	return {
		stats: {
			revenue: totals[0]?.revenue ?? 0,
			orders: totals[0]?.orders ?? 0,
			pending: totals[0]?.pending ?? 0,
			customers: customerCount?.n ?? 0,
			lowStock: lowStock[0]?.n ?? 0
		},
		series,
		byStatus: byStatus.map((s) => ({ label: s.status.replace('_', ' '), value: s.n })),
		recent
	};
};
