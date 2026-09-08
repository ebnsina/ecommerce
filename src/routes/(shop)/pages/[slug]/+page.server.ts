import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { pages } from '$lib/server/db/schema';
import { resolveBlocks } from '$lib/server/blocks';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url, locals }) => {
	const [page] = await db.select().from(pages).where(eq(pages.slug, params.slug)).limit(1);
	if (!page) error(404, 'Page not found');

	const staff = locals.user?.kind === 'admin';
	if (!page.published && !staff) error(404, 'Page not found');

	const preview = url.searchParams.get('preview') === '1' && staff;
	const blocks = preview ? (page.draftBlocks ?? page.blocks) : page.blocks;

	// Return only what the view needs. The raw row carries unsanitised `blocks`,
	// and returning it would ship author HTML to the browser in the hydration
	// payload even though the rendered markup is clean.
	return {
		page: {
			title: page.title,
			slug: page.slug,
			published: page.published,
			seoTitle: page.seoTitle,
			seoDescription: page.seoDescription
		},
		preview,
		blocks: await resolveBlocks(blocks)
	};
};
