import { asc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { categories, menus, wishlist } from '$lib/server/db/schema';
import { getSettings } from '$lib/server/settings';
import { findCart, getLines, summarise } from '$lib/server/cart';
import { getCompareIds } from '$lib/server/compare';
import { normalizeTheme, themeCss } from '$lib/theme';
import { isLayoutKey, layoutOf } from '$lib/layouts';
import { SHOP } from '$lib/paths';
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
	const lines = cart ? await getLines(cart.id) : [];
	const cartSummary = {
		...summarise(lines),
		lines: lines.map((l) => ({ id: l.id, productId: l.productId, qty: l.qty })),
		/* Enough of each product for the standing basket to draw its rows. The
		   cart page still loads the full lines it needs. */
		items: lines.map((l) => ({
			id: l.productId,
			slug: l.slug,
			title: l.title,
			image: l.image,
			unitPrice: l.unitPrice
		}))
	};

	/* Which products are already saved, so every heart on the site can show it.
	   Ids only — the cards already have everything else they need. */
	const saved =
		locals.user?.kind === 'customer'
			? await db
					.select({ productId: wishlist.productId })
					.from(wishlist)
					.where(eq(wishlist.customerId, locals.user.id))
			: [];

	/* Which layout this visitor sees. `?layout=grocery` switches and sticks, so
	   one deployment can be shown as five different shops in five tabs without
	   five databases behind it. Absent that, the store's own setting stands. */
	const wanted = event.url.searchParams.get('layout');
	if (isLayoutKey(wanted))
		event.cookies.set('layout', wanted, { path: SHOP, maxAge: 60 * 60 * 24 * 365 });
	const picked = wanted ?? event.cookies.get('layout');
	const shape = layoutOf(picked ?? config.layout);

	/* A layout brings its own colour only when someone is trying layouts on. A
	   real store that chose Grocery in Settings keeps the theme it picked — the
	   layout decides shape, the owner decides colour. */
	const theme = isLayoutKey(picked)
		? normalizeTheme({ ...config.theme, preset: shape.palette })
		: normalizeTheme(config.theme);

	const roots = rows.filter((r) => !r.parentId);

	return {
		nav: roots.map((r) => ({ ...r, children: rows.filter((c) => c.parentId === r.id) })),
		menus: Object.fromEntries(menuRows.map((m) => [m.key, m.tree])),
		settings: config,
		customer: locals.user?.kind === 'customer' ? locals.user : null,
		cartCount: cartSummary.count,
		compareIds: getCompareIds(event),
		wishlistIds: saved.map((w) => w.productId),
		layout: shape.key,
		/* The lines themselves, not just a count: the grocery layout stands its
		   basket on the page, and every card needs to know what is already in
		   it to show a quantity instead of a plus. */
		cartLines: cartSummary.lines,
		cartItems: cartSummary.items,
		cartSubtotal: cartSummary.subtotal,
		themeCss: themeCss(theme)
	};
};
