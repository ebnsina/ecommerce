import { count, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { products } from '$lib/server/db/schema';
import { reindexAll, searchConfigured } from '$lib/server/search';
import { topSearches, unmetDemand } from '$lib/server/intent';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [[{ n: active }], searches, unmet] = await Promise.all([
		db.select({ n: count() }).from(products).where(eq(products.status, 'active')),
		topSearches(30, 10),
		unmetDemand(30, 10)
	]);

	return { configured: searchConfigured(), active, searches, unmet };
};

export const actions: Actions = {
	reindex: async () => {
		const result = await reindexAll();
		if (!result.configured)
			return { error: 'Search is not connected yet — see Integrations for the settings it needs.' };
		return { indexed: result.indexed };
	}
};
