import { error, fail } from '@sveltejs/kit';
import { asc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { pages, categories, products } from '$lib/server/db/schema';
import { slugify, uniqueSlug } from '$lib/slug';
import type { Block } from '$lib/server/db/schema';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const [page] = await db.select().from(pages).where(eq(pages.id, params.id)).limit(1);
	if (!page) error(404, 'Page not found');

	const [cats, catalog] = await Promise.all([
		db
			.select({ id: categories.id, name: categories.name, parentId: categories.parentId })
			.from(categories)
			.orderBy(asc(categories.sort), asc(categories.name)),
		db
			.select({ id: products.id, title: products.title })
			.from(products)
			.where(eq(products.status, 'active'))
			.orderBy(asc(products.title))
			.limit(500)
	]);

	return { page, categories: cats, catalog };
};

/** Parses the editor payload, keeping only well-formed blocks. */
function readBlocks(raw: string): Block[] {
	const parsed = JSON.parse(raw || '[]');
	if (!Array.isArray(parsed)) return [];
	return parsed
		.filter((b) => b && typeof b.type === 'string')
		.map((b) => ({
			id: typeof b.id === 'string' ? b.id : crypto.randomUUID(),
			type: b.type,
			props: b.props && typeof b.props === 'object' ? b.props : {}
		}));
}

export const actions: Actions = {
	/** Saves the draft only — the live page is untouched until Publish. */
	saveDraft: async ({ request, params }) => {
		const form = await request.formData();
		await db
			.update(pages)
			.set({ draftBlocks: readBlocks(String(form.get('blocks') ?? '')), updatedAt: new Date() })
			.where(eq(pages.id, params.id));
		return { saved: 'draft' as const };
	},

	publish: async ({ request, params }) => {
		const form = await request.formData();
		const blocks = readBlocks(String(form.get('blocks') ?? ''));
		const title = String(form.get('title') ?? '').trim();
		if (!title) return fail(400, { error: 'Give the page a title.' });

		const [current] = await db.select().from(pages).where(eq(pages.id, params.id)).limit(1);
		const taken = await db.select({ slug: pages.slug }).from(pages);
		const slug =
			current?.slug === 'home'
				? 'home' // the homepage keeps its slug whatever the field says
				: uniqueSlug(
						slugify(String(form.get('slug') ?? '') || title),
						new Set(taken.filter((t) => t.slug !== current?.slug).map((t) => t.slug))
					);

		await db
			.update(pages)
			.set({
				title,
				slug,
				blocks,
				draftBlocks: null,
				seoTitle: String(form.get('seoTitle') ?? '').trim() || null,
				seoDescription: String(form.get('seoDescription') ?? '').trim() || null,
				published: form.get('published') === 'on',
				updatedAt: new Date()
			})
			.where(eq(pages.id, params.id));

		return { saved: 'published' as const };
	}
};
