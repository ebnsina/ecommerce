import { fail, redirect } from '@sveltejs/kit';
import { and, eq, inArray } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { products, productOptions, categories, productCategories } from '$lib/server/db/schema';
import { cardColumns } from '$lib/server/catalog';
import { getCompareIds, toggleCompare, removeCompare, clearCompare } from '$lib/server/compare';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const ids = getCompareIds(event);
	if (!ids.length) return { items: [] };

	const rows = await db
		.select({
			...cardColumns,
			brand: products.brand,
			description: products.description,
			soldCount: products.soldCount
		})
		.from(products)
		.where(and(eq(products.status, 'active'), inArray(products.id, ids)));

	const [opts, cats] = await Promise.all([
		db
			.select({
				productId: productOptions.productId,
				name: productOptions.name,
				values: productOptions.values
			})
			.from(productOptions)
			.where(inArray(productOptions.productId, ids)),
		db
			.select({ productId: productCategories.productId, name: categories.name })
			.from(productCategories)
			.innerJoin(categories, eq(categories.id, productCategories.categoryId))
			.where(inArray(productCategories.productId, ids))
	]);

	// Keep the order the shopper added them in.
	const items = ids
		.map((id) => rows.find((r) => r.id === id))
		.filter(Boolean)
		.map((p) => ({
			...p!,
			options: opts.filter((o) => o.productId === p!.id),
			categories: cats.filter((c) => c.productId === p!.id).map((c) => c.name)
		}));

	return { items };
};

export const actions: Actions = {
	toggle: async (event) => {
		const form = await event.request.formData();
		const result = toggleCompare(event, String(form.get('productId') ?? ''));
		const to = String(form.get('redirectTo') ?? '');
		if (!result.ok) return fail(400, { error: result.error });
		if (to) redirect(303, to);
		return { compared: result.added };
	},

	remove: async (event) => {
		removeCompare(event, String((await event.request.formData()).get('productId') ?? ''));
		return { ok: true };
	},

	clear: async (event) => {
		clearCompare(event);
		return { ok: true };
	}
};
