import { error, redirect } from '@sveltejs/kit';
import { ask } from '$lib/server/shopAssistant';
import { appendTurns, deleteThread, loadThread, visitorId } from '$lib/server/chat';
import { SHOP } from '$lib/paths';
import type { Actions, PageServerLoad } from './$types';

/**
 * A saved conversation.
 *
 * `?q=` carries on the thread without JavaScript, then redirects back to the
 * bare URL so a refresh does not ask the same question twice.
 */
export const load: PageServerLoad = async (event) => {
	const visitor = visitorId(event);
	const thread = await loadThread(visitor, event.params.thread);
	if (!thread) error(404, 'That conversation is not here.');

	const q = event.url.searchParams.get('q')?.trim() ?? '';
	if (!q) return { thread, problem: '' };

	const outcome = await ask(q, event.getClientAddress(), thread.turns.slice(-6));
	if ('error' in outcome) return { thread, problem: outcome.error };

	await appendTurns(visitor, thread.id, [
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

	redirect(303, `${SHOP}/ask/${thread.id}`);
};

export const actions: Actions = {
	/* Posted at from the sidebar of any thread, not just this one. */
	delete: async (event) => {
		await deleteThread(visitorId(event), event.params.thread);
		redirect(303, `${SHOP}/ask`);
	}
};
