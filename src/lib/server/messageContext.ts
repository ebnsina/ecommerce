/**
 * Works out what an inbound message is about.
 *
 * A message arriving as "delivery charge koto?" is unanswerable without knowing
 * which product prompted it. Chat platforms give us three chances to know:
 *
 *   1. a referral payload — Messenger's m.me/<page>?ref=<slug>
 *   2. a product link the customer pasted, which our own WhatsApp button prefills
 *   3. the page the website widget was opened from
 */
import { eq } from 'drizzle-orm';
import { db } from './db';
import { products } from './db/schema';

/** Pulls a product slug out of any /p/<slug> URL in a body of text. */
export function slugFromText(text: string): string | null {
	const match = text.match(/\/p\/([a-z0-9ঀ-৿-]+)/i);
	return match?.[1] ?? null;
}

/** Normalises a referral payload, which platforms pass through verbatim. */
export function slugFromRef(ref: string | null | undefined): string | null {
	if (!ref) return null;
	const cleaned = ref.trim().replace(/^product[:_-]/i, '');
	return /^[a-z0-9ঀ-৿-]+$/i.test(cleaned) ? cleaned : slugFromText(cleaned);
}

export async function resolveProduct(slug: string | null) {
	if (!slug) return null;
	const [row] = await db
		.select({ id: products.id, title: products.title, slug: products.slug })
		.from(products)
		.where(eq(products.slug, slug))
		.limit(1);
	return row ?? null;
}

/** Best guess at the subject of a message, from whichever signal exists. */
export async function contextFor(input: {
	body?: string | null;
	ref?: string | null;
	sourceUrl?: string | null;
}) {
	const slug =
		slugFromRef(input.ref) ?? slugFromText(input.sourceUrl ?? '') ?? slugFromText(input.body ?? '');
	return resolveProduct(slug);
}
