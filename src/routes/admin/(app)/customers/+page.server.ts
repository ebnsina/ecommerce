import { and, desc, eq, ilike, or, sql, count } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { customers, orders } from '$lib/server/db/schema';
import type { PageServerLoad } from './$types';

const PER_PAGE = 30;

export const load: PageServerLoad = async ({ url }) => {
	const q = url.searchParams.get('q')?.trim() ?? '';
	const tag = url.searchParams.get('tag') ?? '';
	const page = Math.max(1, Number(url.searchParams.get('page') ?? 1));

	const where = and(
		q ? or(ilike(customers.phone, `%${q}%`), ilike(customers.name, `%${q}%`)) : undefined,
		tag ? sql`${tag} = any(${customers.tags})` : undefined
	);

	const [rows, [{ n: total }], tagRows] = await Promise.all([
		db
			.select({
				id: customers.id,
				phone: customers.phone,
				name: customers.name,
				tags: customers.tags,
				createdAt: customers.createdAt,
				orders: sql<number>`(select count(*) from ${orders}
					where ${orders.customerId} = ${customers.id})::int`,
				spent: sql<number>`(select coalesce(sum(${orders.total}), 0) from ${orders}
					where ${orders.customerId} = ${customers.id}
					  and ${orders.status} = 'delivered')::int`
			})
			.from(customers)
			.where(where)
			.orderBy(desc(customers.createdAt))
			.limit(PER_PAGE)
			.offset((page - 1) * PER_PAGE),
		db.select({ n: count() }).from(customers).where(where),
		db.select({ tag: sql<string>`unnest(${customers.tags})` }).from(customers)
	]);

	return {
		rows,
		total,
		page,
		pages: Math.max(1, Math.ceil(total / PER_PAGE)),
		tags: [...new Set(tagRows.map((t) => t.tag))].sort(),
		filters: { q, tag }
	};
};
