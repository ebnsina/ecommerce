import { json } from '@sveltejs/kit';
import { ask } from '$lib/server/shopAssistant';
import type { RequestHandler } from './$types';

/**
 * One turn of the conversation.
 *
 * The thread lives in the browser and the whole of it is sent each time, so
 * there is no session to keep and nothing to clean up. Only the last message
 * decides the search; the earlier ones are context, which is why the endpoint
 * takes a thread and hands back a single answer.
 *
 * Rate limiting lives in `ask`, per address — an LLM endpoint on a storefront
 * is somebody else's free API key if it is not held down.
 */
export const POST: RequestHandler = async ({ request, getClientAddress }) => {
	const body = await request.json().catch(() => null);
	const message = typeof body?.message === 'string' ? body.message : '';
	const history = Array.isArray(body?.history) ? body.history.slice(-6) : [];

	const outcome = await ask(message, getClientAddress(), history);
	if ('error' in outcome) return json({ error: outcome.error }, { status: 429 });

	return json({
		reply: outcome.reply,
		rows: outcome.rows,
		total: outcome.total,
		followUps: outcome.followUps,
		query: outcome.intent.query
	});
};
