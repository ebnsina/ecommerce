import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { pages } from '$lib/server/db/schema';
import { resolveBlocks } from '$lib/server/blocks';
import type { PageServerLoad } from './$types';

/** The homepage is the `home` page row — same renderer as every other CMS page. */
export const load: PageServerLoad = async ({ url, locals }) => {
	const [home] = await db.select().from(pages).where(eq(pages.slug, 'home')).limit(1);

	// ?preview=1 shows the unpublished draft, staff only.
	const preview = url.searchParams.get('preview') === '1' && locals.user?.kind === 'admin';
	const blocks = preview ? (home?.draftBlocks ?? home?.blocks ?? []) : (home?.blocks ?? []);

	return {
		blocks: await resolveBlocks(blocks),
		preview,
		seo: { title: home?.seoTitle, description: home?.seoDescription }
	};
};
