import { inArray } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { pages } from '$lib/server/db/schema';
import { resolveBlocks } from '$lib/server/blocks';
import type { PageServerLoad } from './$types';

/**
 * The homepage is the `home` page row — same renderer as every other CMS page.
 *
 * A layout may bring its own arrangement: `home-grocery` leads with a category
 * strip and dense rows, `home-tech` with deals and spec rows. Whatever is not
 * written for a layout falls back to `home`, so adding a layout never leaves a
 * blank front page.
 */
export const load: PageServerLoad = async ({ url, locals, parent }) => {
	const { layout } = await parent();
	const rows = await db
		.select()
		.from(pages)
		.where(inArray(pages.slug, [`home-${layout}`, 'home']));
	const home = rows.find((r) => r.slug === `home-${layout}`) ?? rows.find((r) => r.slug === 'home');

	// ?preview=1 shows the unpublished draft, staff only.
	const preview = url.searchParams.get('preview') === '1' && locals.user?.kind === 'admin';
	const blocks = preview ? (home?.draftBlocks ?? home?.blocks ?? []) : (home?.blocks ?? []);

	return {
		blocks: await resolveBlocks(blocks),
		preview,
		seo: { title: home?.seoTitle, description: home?.seoDescription }
	};
};
