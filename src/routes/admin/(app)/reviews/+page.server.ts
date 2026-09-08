import { fail } from '@sveltejs/kit';
import { desc, eq, isNull, sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { productReviews, productQuestions, products } from '$lib/server/db/schema';
import { refreshRating } from '$lib/server/reviews';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [reviews, questions] = await Promise.all([
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
			.orderBy(productReviews.approved, desc(productReviews.createdAt))
			.limit(100),

		db
			.select({
				id: productQuestions.id,
				productTitle: products.title,
				productSlug: products.slug,
				authorName: productQuestions.authorName,
				question: productQuestions.question,
				answer: productQuestions.answer,
				createdAt: productQuestions.createdAt
			})
			.from(productQuestions)
			.innerJoin(products, eq(products.id, productQuestions.productId))
			.orderBy(sql`${productQuestions.answer} is not null`, desc(productQuestions.createdAt))
			.limit(100)
	]);

	return {
		reviews,
		questions,
		pendingReviews: reviews.filter((r) => !r.approved).length,
		unanswered: questions.filter((q) => !q.answer).length
	};
};

export const actions: Actions = {
	approve: async ({ request }) => {
		const id = String((await request.formData()).get('id') ?? '');
		const [row] = await db
			.update(productReviews)
			.set({ approved: true })
			.where(eq(productReviews.id, id))
			.returning({ productId: productReviews.productId });
		if (row) await refreshRating(row.productId); // the star rating is a cache
		return { ok: true };
	},

	unapprove: async ({ request }) => {
		const id = String((await request.formData()).get('id') ?? '');
		const [row] = await db
			.update(productReviews)
			.set({ approved: false })
			.where(eq(productReviews.id, id))
			.returning({ productId: productReviews.productId });
		if (row) await refreshRating(row.productId);
		return { ok: true };
	},

	deleteReview: async ({ request }) => {
		const id = String((await request.formData()).get('id') ?? '');
		const [row] = await db
			.delete(productReviews)
			.where(eq(productReviews.id, id))
			.returning({ productId: productReviews.productId });
		if (row) await refreshRating(row.productId);
		return { ok: true };
	},

	answer: async ({ request, locals }) => {
		const f = await request.formData();
		const answer = String(f.get('answer') ?? '').trim();
		if (!answer) return fail(400, { error: 'Write an answer first.' });

		await db
			.update(productQuestions)
			.set({
				answer,
				answeredAt: new Date(),
				answeredBy: locals.user?.kind === 'admin' ? locals.user.id : null
			})
			.where(eq(productQuestions.id, String(f.get('id') ?? '')));
		return { ok: true };
	},

	deleteQuestion: async ({ request }) => {
		await db
			.delete(productQuestions)
			.where(eq(productQuestions.id, String((await request.formData()).get('id') ?? '')));
		return { ok: true };
	}
};
