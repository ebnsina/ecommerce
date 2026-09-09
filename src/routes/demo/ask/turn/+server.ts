import { json } from '@sveltejs/kit';
import { ask } from '$lib/server/shopAssistant';
import { appendTurns, visitorId } from '$lib/server/chat';
import type { RequestHandler } from './$types';

/**
 * One turn of the conversation.
 *
 * The browser sends the recent messages as context and the id of the thread
 * they belong to; the answer is written to that thread, or to a new one, and
 * the id comes back so the client can put it in the address bar. Only the last
 * message decides the search — the earlier ones are context.
 *
 * Rate limiting lives in `ask`, per address — an LLM endpoint on a storefront
 * is somebody else's free API key if it is not held down.
 */
export const POST: RequestHandler = async (event) => {
	const body = await event.request.json().catch(() => null);
	const message = typeof body?.message === 'string' ? body.message : '';
	const history = Array.isArray(body?.history) ? body.history.slice(-6) : [];
	const threadId = typeof body?.threadId === 'string' ? body.threadId : null;

	const outcome = await ask(message, event.getClientAddress(), history);
	if ('error' in outcome) return json({ error: outcome.error }, { status: 429 });

	const id = await appendTurns(visitorId(event), threadId, [
		{ role: 'user', content: message },
		{
			role: 'assistant',
			content: outcome.reply,
			productIds: outcome.rows.map((r) => r.id),
			total: outcome.total,
			query: outcome.intent.query,
			followUps: outcome.followUps
		}
	]);

	return json({
		threadId: id,
		reply: outcome.reply,
		rows: outcome.rows,
		total: outcome.total,
		followUps: outcome.followUps,
		query: outcome.intent.query
	});
};
