/**
 * Product feed for Facebook Catalog and Google Merchant Center — the same RSS
 * 2.0 + g: namespace format both accept, so one endpoint serves both.
 */
import { eq, sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { products } from '$lib/server/db/schema';
import type { RequestHandler } from './$types';

const esc = (s: string) =>
	String(s ?? '')
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');

const tk = (poisha: number) => `${(poisha / 100).toFixed(2)} BDT`;

export const GET: RequestHandler = async ({ url, setHeaders }) => {
	const origin = url.origin;

	const rows = await db
		.select({
			id: products.id,
			title: products.title,
			slug: products.slug,
			description: products.description,
			brand: products.brand,
			price: products.price,
			compareAtPrice: products.compareAtPrice,
			stock: products.stock,
			hasVariants: products.hasVariants,
			image: sql<string | null>`(select pi.url from product_images pi
				where pi.product_id = products.id order by pi.sort limit 1)`,
			category: sql<string | null>`(select c.name from product_categories pc
				join categories c on c.id = pc.category_id
				where pc.product_id = products.id limit 1)`
		})
		.from(products)
		.where(eq(products.status, 'active'))
		.limit(5000);

	// A feed entry without an image is rejected by both platforms, so skip those
	// rather than shipping items that will fail review.
	const items = rows
		.filter((p) => p.image)
		.map((p) => {
			// compare_at is the "was" price, so it becomes price and the real price
			// becomes sale_price — the way both platforms read a discount.
			const onSale = p.compareAtPrice && p.compareAtPrice > p.price;
			return `  <item>
    <g:id>${esc(p.id)}</g:id>
    <g:title>${esc(p.title)}</g:title>
    <g:description>${esc(p.description || p.title)}</g:description>
    <g:link>${origin}/p/${esc(p.slug)}</g:link>
    <g:image_link>${esc(p.image!)}</g:image_link>
    <g:availability>${p.hasVariants || p.stock > 0 ? 'in stock' : 'out of stock'}</g:availability>
    <g:condition>new</g:condition>
    <g:price>${tk(onSale ? p.compareAtPrice! : p.price)}</g:price>
${onSale ? `    <g:sale_price>${tk(p.price)}</g:sale_price>\n` : ''}    <g:brand>${esc(p.brand || 'Generic')}</g:brand>
${p.category ? `    <g:product_type>${esc(p.category)}</g:product_type>\n` : ''}  </item>`;
		})
		.join('\n');

	const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
  <title>Product feed</title>
  <link>${origin}</link>
  <description>Product catalog</description>
${items}
</channel>
</rss>`;

	setHeaders({ 'content-type': 'application/xml', 'cache-control': 'public, max-age=3600' });
	return new Response(body);
};
