/** Reviews and Q&A. Ratings on `products` are a cache of approved reviews. */
import { and, eq, sql, desc, count, avg } from 'drizzle-orm';
import { db } from './db';
import { products, productReviews, productQuestions } from './db/schema';

/** Recomputes the cached rating/reviewCount from approved reviews only. */
export async function refreshRating(productId: string) {
	const [agg] = await db
		.select({ n: count(), avg: avg(productReviews.rating) })
		.from(productReviews)
		.where(and(eq(productReviews.productId, productId), eq(productReviews.approved, true)));

	await db
		.update(products)
		.set({
			// stored 0–50 so the column stays an integer (45 = 4.5 stars)
			rating: agg?.avg ? Math.round(Number(agg.avg) * 10) : 0,
			reviewCount: agg?.n ?? 0
		})
		.where(eq(products.id, productId));
}

export async function getReviews(productId: string) {
	const rows = await db
		.select()
		.from(productReviews)
		.where(and(eq(productReviews.productId, productId), eq(productReviews.approved, true)))
		.orderBy(desc(productReviews.createdAt))
		.limit(50);

	/** 5→1 histogram, so the bar chart never has a missing bucket. */
	const breakdown = [5, 4, 3, 2, 1].map((stars) => ({
		stars,
		n: rows.filter((r) => r.rating === stars).length
	}));

	return { rows, breakdown, total: rows.length };
}

export const getQuestions = (productId: string) =>
	db
		.select()
		.from(productQuestions)
		.where(eq(productQuestions.productId, productId))
		.orderBy(desc(productQuestions.createdAt))
		.limit(50);

export async function addReview(input: {
	productId: string;
	customerId: string | null;
	authorName: string;
	rating: number;
	title: string | null;
	body: string | null;
}) {
	await db.insert(productReviews).values({ ...input, approved: false });
}

export const addQuestion = (input: {
	productId: string;
	customerId: string | null;
	authorName: string;
	question: string;
}) => db.insert(productQuestions).values(input);

/** Only answered questions are public — an unanswered one is a to-do, not content. */
export const publicQuestions = <T extends { answer: string | null }>(rows: T[]) =>
	rows.filter((q) => q.answer);
