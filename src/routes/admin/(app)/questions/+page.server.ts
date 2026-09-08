import { fail } from '@sveltejs/kit';
import { and, desc, eq, ilike, isNull, isNotNull, or, count } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { productQuestions, products } from '$lib/server/db/schema';
import { listParams } from '$lib/admin/listQuery';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const { q, page, perPage } = listParams(url);
	const status = url.searchParams.get('status') ?? '';

	const where = and(
		q
			? or(
					ilike(productQuestions.authorName, `%${q}%`),
					ilike(productQuestions.question, `%${q}%`),
					ilike(products.title, `%${q}%`)
				)
			: undefined,
		status === 'unanswered' ? isNull(productQuestions.answer) : undefined,
		status === 'answered' ? isNotNull(productQuestions.answer) : undefined
	);

	const [rows, [{ n: total }], [{ n: unanswered }]] = await Promise.all([
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
			.where(where)
			// Unanswered first: a question with nobody on it is the work.
			.orderBy(productQuestions.answer, desc(productQuestions.createdAt))
			.limit(perPage)
			.offset((page - 1) * perPage),
		db
			.select({ n: count() })
			.from(productQuestions)
			.innerJoin(products, eq(products.id, productQuestions.productId))
			.where(where),
		db.select({ n: count() }).from(productQuestions).where(isNull(productQuestions.answer))
	]);

	return { rows, total, page, perPage, unanswered, filters: { q, status } };
};

export const actions: Actions = {
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
		return { answered: true };
	},

	remove: async ({ request }) => {
		const f = await request.formData();
		const ids = String(f.get('ids') ?? f.get('id') ?? '')
			.split(',')
			.filter(Boolean);
		for (const id of ids) await db.delete(productQuestions).where(eq(productQuestions.id, id));
		return { ok: true };
	}
};
