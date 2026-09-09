/** Saved conversations with the shop assistant. */
import { and, desc, eq, inArray } from 'drizzle-orm';
import { db } from './db';
import { chatThreads, products, type ChatTurn } from './db/schema';
import { cardColumns } from './catalog';
import type { RequestEvent } from '@sveltejs/kit';

const COOKIE = 'chat';

/**
 * Who is talking. A cookie, minted on first use — the demo has no sign-in, and
 * asking someone to make an account before they can ask a question is the
 * behaviour this whole feature exists to avoid.
 */
export function visitorId(event: RequestEvent): string {
	const existing = event.cookies.get(COOKIE);
	if (existing) return existing;

	const fresh = crypto.randomUUID();
	event.cookies.set(COOKIE, fresh, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		maxAge: 60 * 60 * 24 * 365
	});
	return fresh;
}

/** Titles only — the sidebar does not need the transcripts. */
export const listThreads = (visitor: string) =>
	db
		.select({ id: chatThreads.id, title: chatThreads.title, updatedAt: chatThreads.updatedAt })
		.from(chatThreads)
		.where(eq(chatThreads.visitorId, visitor))
		.orderBy(desc(chatThreads.updatedAt))
		.limit(40);

/**
 * A thread, with its products read fresh from the catalogue.
 *
 * Anything deleted or hidden since simply does not come back, and a price that
 * changed comes back changed — which is the whole reason the turn stores ids.
 */
export async function loadThread(visitor: string, threadId: string) {
	const [thread] = await db
		.select()
		.from(chatThreads)
		.where(and(eq(chatThreads.id, threadId), eq(chatThreads.visitorId, visitor)))
		.limit(1);
	if (!thread) return null;

	const ids = [...new Set(thread.turns.flatMap((t) => t.productIds ?? []))];
	const rows = ids.length
		? await db
				.select(cardColumns)
				.from(products)
				.where(and(eq(products.status, 'active'), inArray(products.id, ids)))
		: [];

	return {
		id: thread.id,
		title: thread.title,
		turns: thread.turns.map((turn) => ({
			...turn,
			rows: (turn.productIds ?? [])
				.map((pid) => rows.find((r) => r.id === pid))
				.filter((r) => r !== undefined)
		}))
	};
}

/** The first question, short enough for a sidebar. */
const titleOf = (text: string) => (text.length > 60 ? `${text.slice(0, 57)}…` : text) || 'New chat';

/**
 * Adds a question and its answer to a thread, making the thread if there is
 * none yet. Returns the id either way, so the client can put it in the URL.
 */
export async function appendTurns(
	visitor: string,
	threadId: string | null,
	turns: ChatTurn[]
): Promise<string> {
	if (threadId) {
		const [existing] = await db
			.select({ turns: chatThreads.turns })
			.from(chatThreads)
			.where(and(eq(chatThreads.id, threadId), eq(chatThreads.visitorId, visitor)))
			.limit(1);

		if (existing) {
			await db
				.update(chatThreads)
				.set({ turns: [...existing.turns, ...turns], updatedAt: new Date() })
				.where(eq(chatThreads.id, threadId));
			return threadId;
		}
	}

	const [made] = await db
		.insert(chatThreads)
		.values({ visitorId: visitor, title: titleOf(turns[0]?.content ?? ''), turns })
		.returning({ id: chatThreads.id });
	return made.id;
}

export const deleteThread = (visitor: string, threadId: string) =>
	db
		.delete(chatThreads)
		.where(and(eq(chatThreads.id, threadId), eq(chatThreads.visitorId, visitor)));
