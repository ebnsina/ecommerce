import { fail } from '@sveltejs/kit';
import { eq, inArray, sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import {
	products,
	categories,
	productCategories,
	productImages,
	productOptions,
	variants
} from '$lib/server/db/schema';
import { parseCsv, parseCsvObjects } from '$lib/csv';
import { detectFormat, mapRows, FORMAT_LABELS, type MappedRow } from '$lib/migrate';
import { slugify, uniqueSlug } from '$lib/slug';
import { parseTk } from '$lib/money';
import { PRODUCT_CSV_COLUMNS } from '$lib/productCsv';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => ({ columns: [...PRODUCT_CSV_COLUMNS] });

type RowResult = {
	line: number;
	title: string;
	action: 'created' | 'updated' | 'skipped';
	note?: string;
};

const money = (v: string) => (v.trim() ? parseTk(v) : null);
const yes = (v: string) => ['yes', 'true', '1', 'y'].includes(v.trim().toLowerCase());

export const actions: Actions = {
	import: async ({ request }) => {
		const form = await request.formData();
		const file = form.get('file');
		if (!(file instanceof File) || file.size === 0)
			return fail(400, { error: 'Choose a CSV file first.' });
		if (file.size > 5 * 1024 * 1024) return fail(400, { error: 'That file is over 5MB.' });

		const text = await file.text();
		const raw = parseCsvObjects(text);
		if (!raw.length) return fail(400, { error: 'That file has no data rows.' });

		// Shopify and WooCommerce exports are translated to our columns first, so
		// the writing below stays one code path.
		const format = detectFormat(parseCsv(text)[0] ?? []);
		const rows: MappedRow[] = mapRows(format, raw);
		if (!rows.length) return fail(400, { error: 'No importable product rows found.' });
		if (!rows[0].title && !rows[0].slug)
			return fail(400, { error: 'The file needs at least a title or slug column.' });

		const dryRun = form.get('dryRun') === 'on';

		// Category names are matched case-insensitively; unknown names are
		// reported rather than silently creating categories nobody asked for.
		const cats = await db.select({ id: categories.id, name: categories.name }).from(categories);
		const catByName = new Map(cats.map((c) => [c.name.trim().toLowerCase(), c.id]));

		const existing = await db.select({ id: products.id, slug: products.slug }).from(products);
		const idBySlug = new Map(existing.map((p) => [p.slug, p.id]));
		const taken = new Set(existing.map((p) => p.slug));

		const results: RowResult[] = [];
		let created = 0;
		let updated = 0;

		for (const [i, row] of rows.entries()) {
			const line = i + 2; // header is line 1
			const title = row.title?.trim();
			const slugInput = row.slug?.trim();

			if (!title && !slugInput) {
				results.push({ line, title: '—', action: 'skipped', note: 'No title or slug.' });
				continue;
			}

			let price: number | null, compareAt: number | null, cost: number | null;
			try {
				price = money(row.price ?? '');
				compareAt = money(row.compare_at_price ?? '');
				cost = money(row.cost ?? '');
			} catch (e) {
				results.push({
					line,
					title: title ?? slugInput!,
					action: 'skipped',
					note: (e as Error).message
				});
				continue;
			}

			const slug = slugInput || slugify(title!);
			const id = idBySlug.get(slug);

			if (!id && price === null) {
				results.push({
					line,
					title: title ?? slug,
					action: 'skipped',
					note: 'New products need a price.'
				});
				continue;
			}
			if (compareAt !== null && price !== null && compareAt <= price) {
				results.push({
					line,
					title: title ?? slug,
					action: 'skipped',
					note: 'Compare-at price must be higher than the price.'
				});
				continue;
			}

			const names = (row.categories ?? '')
				.split(';')
				.map((n) => n.trim())
				.filter(Boolean);
			const catIds = names.map((n) => catByName.get(n.toLowerCase())).filter(Boolean) as string[];
			const unknown = names.filter((n) => !catByName.has(n.toLowerCase()));

			const note = unknown.length ? `Unknown categories ignored: ${unknown.join(', ')}` : undefined;

			if (dryRun) {
				results.push({ line, title: title ?? slug, action: id ? 'updated' : 'created', note });
				continue;
			}

			// Only columns present in the file are written, so a partial CSV
			// (say, just slug + stock) never blanks the rest of a product.
			const patch: Record<string, unknown> = { updatedAt: new Date() };
			if (title) patch.title = title;
			if ('title_bn' in row) patch.titleBn = row.title_bn || null;
			if ('brand' in row) patch.brand = row.brand || null;
			if (row.status && ['draft', 'active', 'archived'].includes(row.status))
				patch.status = row.status;
			if (price !== null) patch.price = price;
			if ('compare_at_price' in row) patch.compareAtPrice = compareAt;
			if ('cost' in row) patch.cost = cost;
			if (row.stock) patch.stock = Math.max(0, Number(row.stock) || 0);
			if ('featured' in row) patch.featured = yes(row.featured ?? '');
			if ('description' in row) patch.description = row.description || null;
			if ('seo_title' in row) patch.seoTitle = row.seo_title || null;
			if ('seo_description' in row) patch.seoDescription = row.seo_description || null;

			let productId = id;
			if (productId) {
				await db.update(products).set(patch).where(eq(products.id, productId));
				updated++;
			} else {
				const fresh = uniqueSlug(slug, taken);
				taken.add(fresh);
				const [ins] = await db
					.insert(products)
					.values({
						...patch,
						title: title!,
						slug: fresh,
						price: price!
					} as typeof products.$inferInsert)
					.returning({ id: products.id });
				productId = ins.id;
				idBySlug.set(fresh, productId);
				created++;
			}

			if (names.length) {
				await db.delete(productCategories).where(eq(productCategories.productId, productId));
				if (catIds.length)
					await db
						.insert(productCategories)
						.values(catIds.map((categoryId) => ({ productId, categoryId })));
			}

			// Images are referenced at their source URL rather than downloaded.
			// ponytail: the old store must stay online during the switch — add a
			// "mirror images into storage" pass when that stops being true.
			if (row.images.length) {
				await db.delete(productImages).where(eq(productImages.productId, productId));
				await db
					.insert(productImages)
					.values(row.images.slice(0, 10).map((url, sort) => ({ productId, url, sort })));
			}

			const optionEntries = Object.entries(row.options ?? {}).slice(0, 2);
			if (optionEntries.length) {
				await db.delete(productOptions).where(eq(productOptions.productId, productId));
				await db.delete(variants).where(eq(variants.productId, productId));
				await db
					.insert(productOptions)
					.values(optionEntries.map(([name, values], sort) => ({ productId, name, values, sort })));

				// Cartesian product, same rule the product editor applies.
				const combos = optionEntries.reduce<Record<string, string>[]>(
					(acc, [name, values]) => acc.flatMap((r) => values.map((v) => ({ ...r, [name]: v }))),
					[{}]
				);
				await db.insert(variants).values(
					combos.map((optionValues) => ({
						productId,
						optionValues,
						price: price ?? 0,
						stock: 0
					}))
				);
				await db.update(products).set({ hasVariants: true }).where(eq(products.id, productId));
			}

			results.push({ line, title: title ?? slug, action: id ? 'updated' : 'created', note });
		}

		return {
			format,
			formatLabel: FORMAT_LABELS[format],
			dryRun,
			created,
			updated,
			skipped: results.filter((r) => r.action === 'skipped').length,
			results: results.slice(0, 200)
		};
	}
};
