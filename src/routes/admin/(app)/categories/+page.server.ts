import { fail } from '@sveltejs/kit';
import { eq, asc, sql, and, ne, isNull, count } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { categories, productCategories } from '$lib/server/db/schema';
import { slugify, uniqueSlug } from '$lib/slug';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const rows = await db
		.select({
			id: categories.id,
			parentId: categories.parentId,
			name: categories.name,
			nameBn: categories.nameBn,
			slug: categories.slug,
			image: categories.image,
			sort: categories.sort,
			visible: categories.visible,
			products: sql<number>`(select count(*) from ${productCategories}
				where ${productCategories.categoryId} = ${categories.id})::int`
		})
		.from(categories)
		.orderBy(asc(categories.sort), asc(categories.name));

	// Flat -> two levels. Deeper nesting is a nav problem, not a catalog one.
	const roots = rows.filter((r) => !r.parentId);
	return {
		tree: roots.map((r) => ({ ...r, children: rows.filter((c) => c.parentId === r.id) })),
		flat: rows
	};
};

async function takenSlugs(exceptId?: string) {
	const rows = await db
		.select({ slug: categories.slug })
		.from(categories)
		.where(exceptId ? ne(categories.id, exceptId) : undefined);
	return new Set(rows.map((r) => r.slug));
}

function readForm(form: FormData) {
	const name = String(form.get('name') ?? '').trim();
	const parentId = String(form.get('parentId') ?? '') || null;
	return {
		name,
		nameBn: String(form.get('nameBn') ?? '').trim() || null,
		slugInput: String(form.get('slug') ?? '').trim(),
		parentId,
		image: String(form.get('image') ?? '').trim() || null,
		visible: form.get('visible') === 'on'
	};
}

export const actions: Actions = {
	create: async ({ request }) => {
		const data = readForm(await request.formData());
		if (!data.name) return fail(400, { error: 'Name is required.' });

		const [{ max }] = await db
			.select({ max: sql<number>`coalesce(max(${categories.sort}), -1)::int` })
			.from(categories)
			.where(data.parentId ? eq(categories.parentId, data.parentId) : isNull(categories.parentId));

		await db.insert(categories).values({
			name: data.name,
			nameBn: data.nameBn,
			slug: uniqueSlug(slugify(data.slugInput || data.name), await takenSlugs()),
			parentId: data.parentId,
			image: data.image,
			visible: data.visible,
			sort: max + 1
		});
		return { ok: true };
	},

	update: async ({ request }) => {
		const form = await request.formData();
		const id = String(form.get('id') ?? '');
		const data = readForm(form);
		if (!id) return fail(400, { error: 'Missing category.' });
		if (!data.name) return fail(400, { error: 'Name is required.' });
		if (data.parentId === id) return fail(400, { error: 'A category cannot be its own parent.' });

		await db
			.update(categories)
			.set({
				name: data.name,
				nameBn: data.nameBn,
				slug: uniqueSlug(slugify(data.slugInput || data.name), await takenSlugs(id)),
				parentId: data.parentId,
				image: data.image,
				visible: data.visible
			})
			.where(eq(categories.id, id));
		return { ok: true };
	},

	toggle: async ({ request }) => {
		const id = String((await request.formData()).get('id') ?? '');
		await db
			.update(categories)
			.set({ visible: sql`not ${categories.visible}` })
			.where(eq(categories.id, id));
		return { ok: true };
	},

	/** Swap sort with the neighbour above/below inside the same parent. */
	move: async ({ request }) => {
		const form = await request.formData();
		const id = String(form.get('id') ?? '');
		const dir = form.get('dir') === 'up' ? -1 : 1;

		const [self] = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
		if (!self) return fail(404, { error: 'Category not found.' });

		const siblings = await db
			.select()
			.from(categories)
			.where(self.parentId ? eq(categories.parentId, self.parentId) : isNull(categories.parentId))
			.orderBy(asc(categories.sort), asc(categories.name));

		const i = siblings.findIndex((s) => s.id === id);
		const j = i + dir;
		if (j < 0 || j >= siblings.length) return { ok: true }; // already at the end

		await db.transaction(async (tx) => {
			await tx
				.update(categories)
				.set({ sort: siblings[j].sort })
				.where(eq(categories.id, siblings[i].id));
			await tx
				.update(categories)
				.set({ sort: siblings[i].sort })
				.where(eq(categories.id, siblings[j].id));
		});
		return { ok: true };
	},

	remove: async ({ request }) => {
		const id = String((await request.formData()).get('id') ?? '');

		// parentId has no FK (self-reference), so orphans are ours to prevent.
		const [{ n: kids }] = await db
			.select({ n: count() })
			.from(categories)
			.where(eq(categories.parentId, id));
		if (kids > 0) return fail(400, { error: 'Move or delete its subcategories first.' });

		const [{ n: used }] = await db
			.select({ n: count() })
			.from(productCategories)
			.where(eq(productCategories.categoryId, id));
		if (used > 0)
			return fail(400, {
				error: `${used} product${used > 1 ? 's are' : ' is'} still in this category.`
			});

		await db.delete(categories).where(eq(categories.id, id));
		return { ok: true };
	}
};
