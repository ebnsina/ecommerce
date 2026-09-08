import { unmetDemand } from '$lib/server/intent';
import type { PageServerLoad } from './$types';

/**
 * The one live number on the page.
 *
 * The Insights panel shows searches the demo shop could not answer, read from
 * its own data rather than written down here — so the example can never drift
 * from what the demo actually does, and there is no screenshot to re-take when
 * the design moves.
 */
export const load: PageServerLoad = async () => ({
	unmet: await unmetDemand(30, 4)
});
