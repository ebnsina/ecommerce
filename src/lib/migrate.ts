/**
 * Import mapping for platforms people migrate from. Each preset translates a
 * foreign CSV into our canonical column names, so the existing import pipeline
 * does the writing and only the translation lives here.
 */
export type SourceFormat = 'native' | 'shopify' | 'woocommerce';

export type MappedRow = {
	slug?: string;
	title?: string;
	brand?: string;
	status?: string;
	price?: string;
	compare_at_price?: string;
	stock?: string;
	description?: string;
	categories?: string;
	/* Native-CSV-only columns, passed straight through. */
	title_bn?: string;
	cost?: string;
	featured?: string;
	seo_title?: string;
	seo_description?: string;
	/** Absolute image URLs, first is the primary. */
	images: string[];
	/** Variant axes, e.g. { Size: ['S','M'] } — collected across grouped rows. */
	options: Record<string, string[]>;
};

const has = (row: Record<string, string>, ...keys: string[]) => keys.every((k) => k in row);

/** Detects the source from the header row alone. */
export function detectFormat(headers: string[]): SourceFormat {
	const h = headers.map((x) => x.trim().toLowerCase());
	const row = Object.fromEntries(h.map((k) => [k, '']));
	if (has(row, 'handle') && (has(row, 'variant price') || has(row, 'body (html)')))
		return 'shopify';
	if (has(row, 'regular price') || (has(row, 'sku') && has(row, 'short description')))
		return 'woocommerce';
	return 'native';
}

const stripHtml = (s: string) =>
	s
		.replace(/<br\s*\/?>/gi, '\n')
		.replace(/<\/p>/gi, '\n')
		.replace(/<[^>]+>/g, '')
		.replace(/&nbsp;/g, ' ')
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/\n{3,}/g, '\n\n')
		.trim();

/** Shopify splits one product across several rows sharing a Handle. */
function fromShopify(rows: Record<string, string>[]): MappedRow[] {
	const byHandle = new Map<string, MappedRow>();

	for (const r of rows) {
		const handle = r['handle']?.trim();
		if (!handle) continue;

		let item = byHandle.get(handle);
		if (!item) {
			item = { slug: handle, images: [], options: {} };
			byHandle.set(handle, item);
		}

		// Only the first row of a handle carries the product fields.
		if (r['title']?.trim() && !item.title) {
			item.title = r['title'].trim();
			item.brand = r['vendor']?.trim() || undefined;
			item.description = r['body (html)'] ? stripHtml(r['body (html)']) : undefined;
			item.categories = r['type']?.trim() || undefined;
			item.status = r['published']?.trim().toLowerCase() === 'false' ? 'draft' : 'active';
		}

		if (r['variant price']?.trim() && !item.price) {
			item.price = r['variant price'].trim();
			const compare = r['variant compare at price']?.trim();
			if (compare) item.compare_at_price = compare;
			const qty = r['variant inventory qty']?.trim();
			if (qty) item.stock = qty;
		}

		const img = r['image src']?.trim();
		if (img && !item.images.includes(img)) item.images.push(img);

		for (const n of [1, 2]) {
			const name = r[`option${n} name`]?.trim();
			const value = r[`option${n} value`]?.trim();
			if (!name || !value || name.toLowerCase() === 'title') continue;
			(item.options[name] ??= []).push(value);
		}
	}

	// De-duplicate option values while keeping the order they appeared in.
	for (const item of byHandle.values())
		for (const [k, v] of Object.entries(item.options)) item.options[k] = [...new Set(v)];

	return [...byHandle.values()];
}

/** WooCommerce exports one row per product, images in a single cell. */
function fromWoo(rows: Record<string, string>[]): MappedRow[] {
	return rows
		.filter((r) => (r['type'] ?? 'simple').toLowerCase() !== 'variation')
		.map((r) => {
			const images = (r['images'] ?? '')
				.split(',')
				.map((s) => s.trim())
				.filter(Boolean);

			const regular = r['regular price']?.trim() ?? '';
			const sale = r['sale price']?.trim() ?? '';

			return {
				slug: r['sku']?.trim() || undefined,
				title: r['name']?.trim(),
				brand: r['brands']?.trim() || undefined,
				// A sale price is the live price; regular becomes the struck-through one.
				price: sale || regular,
				compare_at_price: sale && regular ? regular : undefined,
				stock: r['stock']?.trim() || undefined,
				status: r['published']?.trim() === '-1' ? 'draft' : 'active',
				description: stripHtml(r['description'] || r['short description'] || ''),
				categories: (r['categories'] ?? '')
					.split(',')
					// Woo writes nested categories as "Parent > Child"; keep the leaf.
					.map((c) => c.split('>').pop()!.trim())
					.filter(Boolean)
					.join(';'),
				images,
				options: {}
			} satisfies MappedRow;
		});
}

const fromNative = (rows: Record<string, string>[]): MappedRow[] =>
	rows.map((r) => ({
		...r,
		images: (r['images'] ?? '')
			.split(/[,;]/)
			.map((s) => s.trim())
			.filter(Boolean),
		options: {}
	}));

export function mapRows(format: SourceFormat, rows: Record<string, string>[]): MappedRow[] {
	if (format === 'shopify') return fromShopify(rows);
	if (format === 'woocommerce') return fromWoo(rows);
	return fromNative(rows);
}

export const FORMAT_LABELS: Record<SourceFormat, string> = {
	native: 'This store’s own CSV',
	shopify: 'Shopify product export',
	woocommerce: 'WooCommerce product export'
};
