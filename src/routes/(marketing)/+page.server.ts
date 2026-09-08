import { productsBy } from '$lib/server/catalog';
import type { PageServerLoad } from './$types';

/**
 * Real products for the hero.
 *
 * A mocked-up screenshot of a shop is a drawing of a promise. These are the
 * actual rows the demo is selling, rendered by the same card the shop uses, so
 * what the page shows and what it links to cannot drift apart.
 */
export const load: PageServerLoad = async () => ({
	preview: await productsBy('best-seller', 4)
});
