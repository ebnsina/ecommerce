import { and, asc, eq, isNotNull, ne } from 'drizzle-orm';
import { db } from './db';
import { categories, products } from './db/schema';
import { listProducts } from './catalog';
import { generateJson, isAiConfigured, storeContext } from './ai';
import { consume } from './ratelimit';
import { recordSearch } from './intent';

/**
 * Shopping in a sentence.
 *
 * A shopper types what they are after — "gift for my sister, under 2000" — and
 * gets real products they can put in a basket. The model never sees the
 * catalogue and never writes a price: all it does is turn a sentence into a
 * search the shop already knows how to run. Everything a customer reads about
 * a product comes from the database, so the assistant cannot promise a price,
 * a stock level or a discount that does not exist.
 *
 * With no AI key configured this still works. The sentence goes to search as
 * typed, a couple of regexes pull the budget out of it, and the shopper gets
 * results — worse ones, but the page is never broken by a missing key.
 */

export type AskIntent = {
	/** What to put in the search box. */
	query: string;
	/** Poisha, inclusive. */
	minPrice?: number;
	maxPrice?: number;
	/** Must be a slug from the shop's own list — the model picks, never invents. */
	categorySlug?: string;
	brands?: string[];
	onSale?: boolean;
	/** One line, written before any result is known, so it can promise nothing. */
	reply: string;
	/** Two or three things they might ask next. */
	followUps?: string[];
};

export type AskResult = {
	message: string;
	reply: string;
	intent: AskIntent;
	rows: Awaited<ReturnType<typeof listProducts>>['rows'];
	total: number;
	followUps: string[];
	/** True when the answer came from a model rather than the plain fallback. */
	assisted: boolean;
};

const TAKA = 100;

/** "under 2000", "below ৳1500", "2000 taka'r moddhe", "1000-3000" */
function budgetFrom(text: string): { minPrice?: number; maxPrice?: number } {
	const t = text.toLowerCase().replace(/,/g, '');

	const range = t.match(/(\d{2,7})\s*(?:-|to|থেকে|theke)\s*(\d{2,7})/);
	if (range) {
		const [lo, hi] = [Number(range[1]), Number(range[2])].sort((a, b) => a - b);
		return { minPrice: lo * TAKA, maxPrice: hi * TAKA };
	}

	const under = t.match(
		/(?:under|below|less than|within|upto|up to|niche|moddhe)\s*৳?\s*(\d{2,7})/
	);
	if (under) return { maxPrice: Number(under[1]) * TAKA };

	const over = t.match(/(?:over|above|more than|beshi)\s*৳?\s*(\d{2,7})/);
	if (over) return { minPrice: Number(over[1]) * TAKA };

	return {};
}

/** The closed lists the model is allowed to choose from. */
async function vocabulary() {
	const [cats, brandRows] = await Promise.all([
		db
			.select({ name: categories.name, slug: categories.slug })
			.from(categories)
			.where(eq(categories.visible, true))
			.orderBy(asc(categories.sort), asc(categories.name))
			.limit(60),
		db
			.selectDistinct({ brand: products.brand })
			.from(products)
			.where(and(eq(products.status, 'active'), isNotNull(products.brand), ne(products.brand, '')))
			.limit(80)
	]);
	return { cats, brands: brandRows.map((b) => b.brand).filter((b): b is string => !!b) };
}

export type Turn = { role: 'user' | 'assistant'; content: string };

async function readIntent(message: string, history: Turn[]): Promise<AskIntent | null> {
	if (!isAiConfigured()) return null;

	const { cats, brands } = await vocabulary();

	const system = `You turn a shopper's sentence into a product search for a Bangladeshi online shop.

${await storeContext()}

Categories you may choose from (use the slug, or omit):
${cats.map((c) => `- ${c.name} (${c.slug})`).join('\n')}

Brands you may choose from (exact spelling, or omit):
${brands.join(', ')}

Reply with JSON only:
{
  "query": "words to search the catalogue with, in English",
  "minPrice": number in poisha, or omit,
  "maxPrice": number in poisha, or omit,
  "categorySlug": "one slug from the list, or omit",
  "brands": ["exact brand names from the list"] or omit,
  "onSale": true only if they asked for offers or discounts,
  "reply": "one short friendly line saying what you are looking for. Never state a price, a stock level or a delivery promise.",
  "followUps": ["two or three short things they might ask next"]
}

Rules:
- Taka in, poisha out: 2000 taka is 200000.
- Never invent a category slug or a brand. Leave it out instead.
- The shopper may write Bangla, English or romanised Bangla. Reply in whichever they used.
- "query" is what goes in the search box, so keep it to the thing itself —
  "saree", "electric kettle" — not the whole sentence.`;

	/* The thread is flattened into the question rather than sent as messages:
	   the model's job here is to read one request in context, not to hold a
	   conversation, and a single user turn keeps the JSON discipline that the
	   whole pipeline depends on. */
	const conversation = history.length
		? `Earlier in this conversation:\n${history
				.map((t) => `${t.role === 'user' ? 'Shopper' : 'You'}: ${t.content}`)
				.join('\n')}\n\nThe shopper now says: ${message}`
		: message;

	return generateJson<AskIntent>(system, conversation);
}

export async function ask(
	message: string,
	ip: string,
	history: Turn[] = []
): Promise<AskResult | { error: string; retryAfter?: number }> {
	const text = message.trim().slice(0, 300);
	if (!text) return { error: 'Tell me what you are looking for.' };

	/* An LLM endpoint on a storefront is somebody else's free API key if it is
	   not held down. Twenty questions an hour is more than any real shopper
	   asks and far less than a script wants. */
	const limit = await consume(`ask:${ip}`, 20, 60 * 60);
	if (!limit.ok)
		return {
			error: 'That is a lot of questions. Try again in a while.',
			retryAfter: limit.retryAfter
		};

	const guessed = await readIntent(text, history).catch(() => null);

	const intent: AskIntent = guessed ?? {
		query: text,
		...budgetFrom(text),
		reply: 'Here is what the shop has for that.'
	};

	// Trust the shopper's own numbers over the model's reading of them.
	const typed = budgetFrom(text);
	if (typed.maxPrice) intent.maxPrice = typed.maxPrice;
	if (typed.minPrice) intent.minPrice = typed.minPrice;

	const chosen = intent.categorySlug
		? await db
				.select({ id: categories.id })
				.from(categories)
				.where(and(eq(categories.slug, intent.categorySlug), eq(categories.visible, true)))
				.limit(1)
		: [];

	const found = await listProducts({
		q: intent.query || text,
		categoryIds: chosen.length ? [chosen[0].id] : undefined,
		minPrice: intent.minPrice,
		maxPrice: intent.maxPrice,
		brands: intent.brands?.length ? intent.brands : undefined,
		onSale: intent.onSale || undefined,
		perPage: 12
	});

	/* Recorded like any other search, so a question nobody could answer shows up
	   in Insights beside the ones typed into the search box. */
	recordSearch(intent.query || text, found.total);

	/* Models sometimes answer with the JSON and an empty `reply`. A turn with no
	   sentence in it reads as a fault, so there is always a line. */
	const reply =
		intent.reply?.trim() ||
		(found.total
			? `Here is what the shop has for that.`
			: `I could not find anything for that in the shop.`);

	return {
		message: text,
		reply,
		intent,
		rows: found.rows,
		total: found.total,
		followUps: (intent.followUps ?? []).slice(0, 3),
		assisted: !!guessed
	};
}
