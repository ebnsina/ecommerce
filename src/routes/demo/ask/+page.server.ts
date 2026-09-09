import { ask } from '$lib/server/shopAssistant';
import { isAiConfigured } from '$lib/server/ai';
import type { PageServerLoad } from './$types';

/**
 * A GET, not a form action.
 *
 * The question lives in the URL, so an answer can be sent to someone, kept in
 * a tab, or reached with the back button — all of which a POST would break.
 * It also means the page works with JavaScript off: the form is a plain GET.
 */
export const load: PageServerLoad = async ({ url, getClientAddress }) => {
	const q = url.searchParams.get('q')?.trim() ?? '';
	if (!q) return { result: null, error: null, aiOn: isAiConfigured() };

	const outcome = await ask(q, getClientAddress());
	if ('error' in outcome) return { result: null, error: outcome.error, aiOn: isAiConfigured() };

	return { result: outcome, error: null, aiOn: isAiConfigured() };
};
