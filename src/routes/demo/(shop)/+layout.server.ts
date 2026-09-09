import { asc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { categories, menus, wishlist } from '$lib/server/db/schema';
import { getSettings } from '$lib/server/settings';
import { findCart, getLines, summarise } from '$lib/server/cart';
import { getCompareIds } from '$lib/server/compare';
import { normalizeTheme, themeCss } from '$lib/theme';
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

	/* Which products are already saved, so every heart on the site can show it.
	   Ids only — the cards already have everything else they need. */
	const saved =
		locals.user?.kind === 'customer'
			? await db
					.select({ productId: wishlist.productId })
					.from(wishlist)
					.where(eq(wishlist.customerId, locals.user.id))
			: [];

	const roots = rows.filter((r) => !r.parentId);

	return {
		/* Whether to ask a first-time visitor who they are. The cookie is set by
		   either button on the form, so the question is asked once and then never
		   again — see demo/(shop)/hello. */
		askLead: !event.cookies.get('lead'),
		nav: roots.map((r) => ({ ...r, children: rows.filter((c) => c.parentId === r.id) })),
		menus: Object.fromEntries(menuRows.map((m) => [m.key, m.tree])),
		settings: config,
		customer: locals.user?.kind === 'customer' ? locals.user : null,
		cartCount: cartSummary.count,
		compareIds: getCompareIds(event),
		wishlistIds: saved.map((w) => w.productId),
		themeCss: themeCss(normalizeTheme(config.theme))
	};
};
