import { error } from '@sveltejs/kit';
import { and, eq, ne, sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import {
	products,
	productImages,
	productOptions,
	productCategories,
	categories,
	variants
} from '$lib/server/db/schema';
import { cardColumns } from '$lib/server/catalog';
import {
	getReviews,
	getQuestions,
	addReview,
	addQuestion,
	publicQuestions
} from '$lib/server/reviews';
import { fail } from '@sveltejs/kit';
import { addAction, buyNowAction, wishlistAction } from '$lib/server/cart-actions';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const [product] = await db
		.select()
		.from(products)
		.where(and(eq(products.slug, params.slug), eq(products.status, 'active')))
		.limit(1);
	if (!product) error(404, 'Product not found');

	const [images, options, rows, cats, reviews, questions] = await Promise.all([
		db
			.select()
			.from(productImages)
			.where(eq(productImages.productId, product.id))
			.orderBy(productImages.sort),
		db
			.select()
			.from(productOptions)
			.where(eq(productOptions.productId, product.id))
			.orderBy(productOptions.sort),
		db
			.select()
			.from(variants)
			.where(and(eq(variants.productId, product.id), eq(variants.active, true))),
		db
			.select({ id: categories.id, name: categories.name, slug: categories.slug })
			.from(productCategories)
			.innerJoin(categories, eq(categories.id, productCategories.categoryId))
			.where(eq(productCategories.productId, product.id)),
		getReviews(product.id),
		getQuestions(product.id)
	]);

	const related = cats.length
		? await db
				.select(cardColumns)
				.from(products)
				.where(
					and(
						eq(products.status, 'active'),
						ne(products.id, product.id),
						sql`exists (select 1 from ${productCategories}
							where ${productCategories.productId} = ${products.id}
							  and ${productCategories.categoryId} in ${cats.map((c) => c.id)})`
					)
				)
				.limit(5)
		: [];

	return {
		product,
		images: images.map((i) => i.url),
		options: options.map((o) => ({ name: o.name, values: o.values })),
		variants: rows.map((v) => ({
			id: v.id,
			sku: v.sku,
			optionValues: v.optionValues,
			price: v.price,
			compareAtPrice: v.compareAtPrice,
			stock: v.stock,
			image: v.image
		})),
		categories: cats,
		reviews,
		questions: publicQuestions(questions),
		related
	};
};

/** Same handlers as /cart, so a failed add renders on the product page. */
export const actions: Actions = {
	add: addAction,
	buy: buyNowAction,
	wishlist: wishlistAction,

	review: async ({ request, params, locals }) => {
		const f = await request.formData();
		const rating = Number(f.get('rating') ?? 0);
		const name = String(f.get('authorName') ?? '').trim();
		const body = String(f.get('body') ?? '').trim();

		if (!name) return fail(400, { reviewError: 'Add your name.' });
		if (!(rating >= 1 && rating <= 5))
			return fail(400, { reviewError: 'Pick a rating from 1 to 5.' });
		if (body.length < 10)
			return fail(400, { reviewError: 'Tell us a little more — at least 10 characters.' });

		const [product] = await db
			.select({ id: products.id })
			.from(products)
			.where(eq(products.slug, params.slug))
			.limit(1);
		if (!product) return fail(404, { reviewError: 'Product not found.' });

		await addReview({
			productId: product.id,
			customerId: locals.user?.kind === 'customer' ? locals.user.id : null,
			authorName: name,
			rating,
			title: String(f.get('title') ?? '').trim() || null,
			body
		});
		return { reviewSubmitted: true };
	},

	question: async ({ request, params, locals }) => {
		const f = await request.formData();
		const name = String(f.get('authorName') ?? '').trim();
		const question = String(f.get('question') ?? '').trim();

		if (!name) return fail(400, { questionError: 'Add your name.' });
		if (question.length < 10) return fail(400, { questionError: 'Ask a full question.' });

		const [product] = await db
			.select({ id: products.id })
			.from(products)
			.where(eq(products.slug, params.slug))
			.limit(1);
		if (!product) return fail(404, { questionError: 'Product not found.' });

		await addQuestion({
			productId: product.id,
			customerId: locals.user?.kind === 'customer' ? locals.user.id : null,
			authorName: name,
			question
		});
		return { questionSubmitted: true };
	}
};
