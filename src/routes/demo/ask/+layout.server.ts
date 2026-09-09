import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { wishlist } from '$lib/server/db/schema';
import { getSettings } from '$lib/server/settings';
import { getCompareIds } from '$lib/server/compare';
import { normalizeTheme, themeCss } from '$lib/theme';
import { layoutOf } from '$lib/layouts';
import { listThreads, visitorId } from '$lib/server/chat';
import type { LayoutServerLoad } from './$types';

/**
 * The assistant sits outside the shop's own layout, so it loads only what its
 * one page needs: the theme, the store's name, and the two lists every product
 * card reads. No categories, no cart, no menus — nothing that would put a
 * header and a footer around a conversation.
 */
export const load: LayoutServerLoad = async (event) => {
	const config = await getSettings();

	/* Re-read when a new conversation is started, so the sidebar shows it
	   without a round trip through the whole page. */
	event.depends('chat:threads');

	const saved =
		event.locals.user?.kind === 'customer'
			? await db
					.select({ productId: wishlist.productId })
					.from(wishlist)
					.where(eq(wishlist.customerId, event.locals.user.id))
			: [];

	return {
		threads: await listThreads(visitorId(event)),
		store: config.store,
		layout: layoutOf(event.cookies.get('layout') ?? config.layout).key,
		compareIds: getCompareIds(event),
		wishlistIds: saved.map((w) => w.productId),
		themeCss: themeCss(normalizeTheme(config.theme))
	};
};
