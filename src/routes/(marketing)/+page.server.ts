import { productsBy } from '$lib/server/catalog';
import { topSearches, unmetDemand } from '$lib/server/intent';
import type { PageServerLoad } from './$types';

/**
 * Real rows for the hero panel.
 *
 * Both the platforms this page competes with lead on a picture of their own
 * interface. This one leads on the interface itself, rendered live from the
 * demo's data — so it can never drift from what the demo actually shows, and
 * there is no screenshot to re-take when the design moves.
 */
export const load: PageServerLoad = async () => {
	const [preview, searches, unmet] = await Promise.all([
		productsBy('best-seller', 8),
		topSearches(30, 4),
		unmetDemand(30, 4)
	]);

	return { preview, searches, unmet };
};
