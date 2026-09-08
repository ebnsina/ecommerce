import { listProducts } from '$lib/server/catalog';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const q = url.searchParams.get('q')?.trim() ?? '';
	const sort = url.searchParams.get('sort') ?? 'newest';
	const list = await listProducts({
		q: q || undefined,
		sort,
		page: Math.max(1, Number(url.searchParams.get('page') ?? 1))
	});
	return { q, sort, ...list };
};
