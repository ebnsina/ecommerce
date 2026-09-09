import { redirect } from '@sveltejs/kit';
import { ask } from '$lib/server/shopAssistant';
import { isAiConfigured } from '$lib/server/ai';
import { appendTurns, visitorId } from '$lib/server/chat';
import { SHOP } from '$lib/paths';
import type { PageServerLoad } from './$types';

/**
 * A new conversation, and the no-JavaScript way to start one.
 *
 * The form below is a plain GET, so `?q=…` has to work on its own: the answer
 * is written to a thread and the browser is sent to that thread's own URL,
 * which means a conversation started without JavaScript is saved, shareable
 * and can be carried on later exactly like any other.
 */
export const load: PageServerLoad = async (event) => {
	const q = event.url.searchParams.get('q')?.trim() ?? '';
	if (!q) return { error: null, aiOn: isAiConfigured() };

	const outcome = await ask(q, event.getClientAddress());
	if ('error' in outcome) return { error: outcome.error, aiOn: isAiConfigured() };

	const id = await appendTurns(visitorId(event), null, [
		{ role: 'user', content: q },
		{
			role: 'assistant',
			content: outcome.reply,
			productIds: outcome.rows.map((r) => r.id),
			total: outcome.total,
			query: outcome.intent.query,
			followUps: outcome.followUps
		}
	]);

	redirect(303, `${SHOP}/ask/${id}`);
};
