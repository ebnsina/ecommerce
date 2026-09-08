import { asc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { categories, menus } from '$lib/server/db/schema';
import { getSettings } from '$lib/server/settings';
import { findCart, getLines, summarise } from '$lib/server/cart';
import { getCompareIds } from '$lib/server/compare';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async (event) => {
	const { locals } = event;
	const [rows, menuRows, config] = await Promise.all([
		db
			.select({
				id: categories.id,
				parentId: categories.parentId,
				name: categories.name,
				nameBn: categories.nameBn,
				slug: categories.slug,
				image: categories.image
			})
			.from(categories)
			.where(eq(categories.visible, true))
			.orderBy(asc(categories.sort), asc(categories.name)),
		db.select().from(menus),
		getSettings()
	]);

	const cart = await findCart(event);
	const cartSummary = cart
		? summarise(await getLines(cart.id))
		: { count: 0, subtotal: 0, problems: [] };

	const roots = rows.filter((r) => !r.parentId);

	return {
		nav: roots.map((r) => ({ ...r, children: rows.filter((c) => c.parentId === r.id) })),
		menus: Object.fromEntries(menuRows.map((m) => [m.key, m.tree])),
		settings: config,
		customer: locals.user?.kind === 'customer' ? locals.user : null,
		cartCount: cartSummary.count,
		compareIds: getCompareIds(event)
	};
};
