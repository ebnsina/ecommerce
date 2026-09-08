import { listProducts } from '$lib/server/catalog';
import { recordSearch } from '$lib/server/intent';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals }) => {
	const q = url.searchParams.get('q')?.trim() ?? '';
	const sort = url.searchParams.get('sort') ?? 'newest';
	const list = await listProducts({
		q: q || undefined,
		sort,
		page: Math.max(1, Number(url.searchParams.get('page') ?? 1))
	});
	// Only the first page: paging through the same search is one search.
	if (q && !url.searchParams.get('page'))
		recordSearch(q, list.total, locals.user?.kind === 'customer' ? locals.user.id : null);

	return { q, sort, ...list };
};
