import { error, fail } from '@sveltejs/kit';
import { asc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { bundles, bundleItems, products } from '$lib/server/db/schema';
import { getBundle } from '$lib/server/bundles';
import { slugify, uniqueSlug } from '$lib/slug';
import { parseTk } from '$lib/money';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const [row] = await db.select().from(bundles).where(eq(bundles.id, params.id)).limit(1);
	if (!row) error(404, 'Bundle not found');

	const [view, catalog] = await Promise.all([
		getBundle(row.id),
		db
			.select({ id: products.id, title: products.title, price: products.price })
			.from(products)
			.where(eq(products.status, 'active'))
			.orderBy(asc(products.title))
			.limit(500)
	]);

	return { bundle: row, view, catalog };
};

export const actions: Actions = {
	save: async ({ request, params }) => {
		const f = await request.formData();
		const title = String(f.get('title') ?? '').trim();
		if (!title) return fail(400, { error: 'Give the bundle a name.' });

		let price: number;
		try {
			price = parseTk(String(f.get('price') ?? '0') || '0');
		} catch (e) {
			return fail(400, { error: (e as Error).message });
		}

		const items = JSON.parse(String(f.get('items') ?? '[]')) as {
			productId: string;
			qty: number;
		}[];
		const clean = items
			.filter((i) => i.productId)
			.map((i) => ({
				productId: i.productId,
				qty: Math.max(1, Number(i.qty) || 1)
			}));

		const active = f.get('active') === 'on';
		// A live bundle needs at least two products and a price, or the offer is
		// meaningless and the storefront would show a "saving" of nothing.
		if (active && clean.length < 2)
			return fail(400, { error: 'A live bundle needs at least two products.' });
		if (active && price <= 0)
			return fail(400, { error: 'Set the bundle price before making it live.' });

		const taken = await db.select({ slug: bundles.slug, id: bundles.id }).from(bundles);

		await db.transaction(async (tx) => {
			await tx
				.update(bundles)
				.set({
					title,
					slug: uniqueSlug(
						slugify(String(f.get('slug') ?? '') || title),
						new Set(taken.filter((t) => t.id !== params.id).map((t) => t.slug))
					),
					description: String(f.get('description') ?? '').trim() || null,
					image: String(f.get('image') ?? '').trim() || null,
					price,
					active
				})
				.where(eq(bundles.id, params.id));

			await tx.delete(bundleItems).where(eq(bundleItems.bundleId, params.id));
			if (clean.length)
				await tx.insert(bundleItems).values(clean.map((i) => ({ bundleId: params.id, ...i })));
		});

		return { ok: true };
	},

	remove: async ({ params }) => {
		await db.delete(bundles).where(eq(bundles.id, params.id));
		error(303, 'Deleted');
	}
};
