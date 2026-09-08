import { and, desc, eq, ilike, or, count } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { productReviews, products } from '$lib/server/db/schema';
import { refreshRating } from '$lib/server/reviews';
import { listParams } from '$lib/admin/listQuery';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const { q, page, perPage } = listParams(url);
	const status = url.searchParams.get('status') ?? '';

	const where = and(
		q
			? or(
					ilike(productReviews.authorName, `%${q}%`),
					ilike(productReviews.body, `%${q}%`),
					ilike(products.title, `%${q}%`)
				)
			: undefined,
		status === 'pending' ? eq(productReviews.approved, false) : undefined,
		status === 'approved' ? eq(productReviews.approved, true) : undefined
	);

	const [rows, [{ n: total }], [{ n: pending }]] = await Promise.all([
		db
			.select({
				id: productReviews.id,
				productId: productReviews.productId,
				productTitle: products.title,
				productSlug: products.slug,
				authorName: productReviews.authorName,
				rating: productReviews.rating,
				title: productReviews.title,
				body: productReviews.body,
				approved: productReviews.approved,
				createdAt: productReviews.createdAt
			})
			.from(productReviews)
			.innerJoin(products, eq(products.id, productReviews.productId))
			// Unapproved first: they are the ones waiting on someone.
			.where(where)
			.orderBy(productReviews.approved, desc(productReviews.createdAt))
			.limit(perPage)
			.offset((page - 1) * perPage),
		db
			.select({ n: count() })
			.from(productReviews)
			.innerJoin(products, eq(products.id, productReviews.productId))
			.where(where),
		db.select({ n: count() }).from(productReviews).where(eq(productReviews.approved, false))
	]);

	return { rows, total, page, perPage, pending, filters: { q, status } };
};

/** The star rating on a product is a cache, so every change refreshes it. */
async function setApproved(id: string, approved: boolean) {
	const [row] = await db
		.update(productReviews)
		.set({ approved })
		.where(eq(productReviews.id, id))
		.returning({ productId: productReviews.productId });
	if (row) await refreshRating(row.productId);
}

const ids = (f: FormData) =>
	String(f.get('ids') ?? f.get('id') ?? '')
		.split(',')
		.filter(Boolean);

export const actions: Actions = {
	approve: async ({ request }) => {
		for (const id of ids(await request.formData())) await setApproved(id, true);
		return { ok: true };
	},

	unapprove: async ({ request }) => {
		for (const id of ids(await request.formData())) await setApproved(id, false);
		return { ok: true };
	},

	remove: async ({ request }) => {
		for (const id of ids(await request.formData())) {
			const [row] = await db
				.delete(productReviews)
				.where(eq(productReviews.id, id))
				.returning({ productId: productReviews.productId });
			if (row) await refreshRating(row.productId);
		}
		return { ok: true };
	}
};
