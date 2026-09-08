import { and, desc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { wishlist, products } from '$lib/server/db/schema';
import { cardColumns } from '$lib/server/catalog';
import { addAction, wishlistAction } from '$lib/server/cart-actions';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => ({
	items: await db
		.select(cardColumns)
		.from(wishlist)
		.innerJoin(products, eq(products.id, wishlist.productId))
		.where(and(eq(wishlist.customerId, locals.user!.id), eq(products.status, 'active')))
		.orderBy(desc(wishlist.createdAt))
});

export const actions: Actions = { add: addAction, wishlist: wishlistAction };
