import { eq, desc } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { products, categories, pages } from '$lib/server/db/schema';
import type { RequestHandler } from './$types';

const esc = (s: string) =>
	s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const day = (d: Date | string | null) => (d ? new Date(d).toISOString().slice(0, 10) : undefined);

/** Only live URLs: active products, visible categories, published pages. */
export const GET: RequestHandler = async ({ url, setHeaders }) => {
	const origin = url.origin;

	const [prodRows, catRows, pageRows] = await Promise.all([
		db
			.select({ slug: products.slug, updatedAt: products.updatedAt })
			.from(products)
			.where(eq(products.status, 'active'))
			.orderBy(desc(products.updatedAt))
			.limit(5000),
		db.select({ slug: categories.slug }).from(categories).where(eq(categories.visible, true)),
		db
			.select({ slug: pages.slug, updatedAt: pages.updatedAt })
			.from(pages)
			.where(eq(pages.published, true))
	]);

	type Entry = { loc: string; lastmod?: string; priority: string; changefreq: string };

	const entries: Entry[] = [
		{ loc: `${origin}/`, priority: '1.0', changefreq: 'daily' },
		{ loc: `${origin}/search`, priority: '0.5', changefreq: 'weekly' },
		...catRows.map((c) => ({
			loc: `${origin}/c/${c.slug}`,
			priority: '0.8',
			changefreq: 'daily'
		})),
		...prodRows.map((p) => ({
			loc: `${origin}/p/${p.slug}`,
			lastmod: day(p.updatedAt),
			priority: '0.7',
			changefreq: 'weekly'
		})),
		...pageRows
			.filter((p) => p.slug !== 'home')
			.map((p) => ({
				loc: `${origin}/pages/${p.slug}`,
				lastmod: day(p.updatedAt),
				priority: '0.4',
				changefreq: 'monthly'
			}))
	];

	const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
	.map(
		(e) =>
			`  <url><loc>${esc(e.loc)}</loc>${e.lastmod ? `<lastmod>${e.lastmod}</lastmod>` : ''}` +
			`<changefreq>${e.changefreq}</changefreq><priority>${e.priority}</priority></url>`
	)
	.join('\n')}
</urlset>`;

	setHeaders({ 'content-type': 'application/xml', 'cache-control': 'public, max-age=3600' });
	return new Response(body);
};
