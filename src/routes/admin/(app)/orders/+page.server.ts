import { and, desc, eq, ilike, or, sql, count } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { orders } from '$lib/server/db/schema';
import type { PageServerLoad } from './$types';

const PER_PAGE = 30;

export const load: PageServerLoad = async ({ url }) => {
	const q = url.searchParams.get('q')?.trim() ?? '';
	const status = url.searchParams.get('status') ?? '';
	const page = Math.max(1, Number(url.searchParams.get('page') ?? 1));

	const where = and(
		q
			? or(
					ilike(orders.number, `%${q}%`),
					ilike(orders.phone, `%${q}%`),
					ilike(orders.name, `%${q}%`)
				)
			: undefined,
		status ? eq(orders.status, status as 'pending') : undefined
	);

	const [rows, [{ n: total }], counts] = await Promise.all([
		db
			.select()
			.from(orders)
			.where(where)
			.orderBy(desc(orders.createdAt))
			.limit(PER_PAGE)
			.offset((page - 1) * PER_PAGE),
		db.select({ n: count() }).from(orders).where(where),
		db.select({ status: orders.status, n: count() }).from(orders).groupBy(orders.status)
	]);

	return {
		rows,
		total,
		page,
		pages: Math.max(1, Math.ceil(total / PER_PAGE)),
		counts: Object.fromEntries(counts.map((c) => [c.status, c.n])) as Record<string, number>,
		filters: { q, status }
	};
};
