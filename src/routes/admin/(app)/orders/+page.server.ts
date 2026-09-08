import { and, desc, eq, ilike, or, count } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { orders } from '$lib/server/db/schema';
import { listParams } from '$lib/admin/listQuery';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const { q, page, perPage } = listParams(url);
	const status = url.searchParams.get('status') ?? '';

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
			.limit(perPage)
			.offset((page - 1) * perPage),
		db.select({ n: count() }).from(orders).where(where),
		db.select({ status: orders.status, n: count() }).from(orders).groupBy(orders.status)
	]);

	return {
		rows,
		total,
		page,
		perPage,
		counts: Object.fromEntries(counts.map((c) => [c.status, c.n])) as Record<string, number>,
		filters: { q, status }
	};
};
