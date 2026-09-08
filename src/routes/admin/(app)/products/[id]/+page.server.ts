import { fail, redirect, error } from '@sveltejs/kit';
import { eq, ne, asc } from 'drizzle-orm';
import { db } from '$lib/server/db';
import {
	products,
	productImages,
	productOptions,
	productCategories,
	categories,
	variants
} from '$lib/server/db/schema';
import { slugify, uniqueSlug } from '$lib/slug';
import { parseTk } from '$lib/money';
import { reindexProduct, removeProduct } from '$lib/server/search';
import type { Actions, PageServerLoad } from './$types';

const EMPTY = {
	id: '',
	title: '',
	titleBn: '',
	slug: '',
	description: '',
	descriptionBn: '',
	brand: '',
	status: 'draft' as const,
	price: 0,
	compareAtPrice: null,
	cost: null,
	stock: 0,
	hasVariants: false,
	featured: false,
	seoTitle: '',
	seoDescription: ''
};

export const load: PageServerLoad = async ({ params }) => {
	const cats = await db
		.select({ id: categories.id, name: categories.name, parentId: categories.parentId })
		.from(categories)
		.orderBy(asc(categories.sort), asc(categories.name));

	if (params.id === 'new') {
		return {
			product: EMPTY,
			images: [],
			options: [],
			variants: [],
			selected: [],
			categories: cats
		};
	}

	const [product] = await db.select().from(products).where(eq(products.id, params.id)).limit(1);
	if (!product) error(404, 'Product not found');

	const [images, options, rows, links] = await Promise.all([
		db
			.select()
			.from(productImages)
			.where(eq(productImages.productId, product.id))
			.orderBy(productImages.sort),
		db
			.select()
			.from(productOptions)
			.where(eq(productOptions.productId, product.id))
			.orderBy(productOptions.sort),
		db.select().from(variants).where(eq(variants.productId, product.id)),
		db.select().from(productCategories).where(eq(productCategories.productId, product.id))
	]);

	return {
		product,
		images: images.map((i) => i.url),
		options: options.map((o) => ({ name: o.name, values: o.values })),
		variants: rows,
		selected: links.map((l) => l.categoryId),
		categories: cats
	};
};

/** '' -> null, '4699' -> 469900. Throws are caught by the caller. */
const money = (v: FormDataEntryValue | null) => {
	const s = String(v ?? '').trim();
	return s ? parseTk(s) : null;
};

type OptionInput = { name: string; values: string[] };
type VariantInput = { key: string; sku: string; price: string; stock: number; active: boolean };

/** Cartesian product of the option values, in declaration order. */
function combinations(options: OptionInput[]): Record<string, string>[] {
	return options.reduce<Record<string, string>[]>(
		(acc, opt) => acc.flatMap((row) => opt.values.map((v) => ({ ...row, [opt.name]: v }))),
		[{}]
	);
}

const keyOf = (values: Record<string, string>) => Object.values(values).join(' / ');

export const actions: Actions = {
	save: async ({ request, params }) => {
		const form = await request.formData();
		const isNew = params.id === 'new';
		const title = String(form.get('title') ?? '').trim();
		if (!title) return fail(400, { error: 'Title is required.' });

		let price: number, compareAtPrice: number | null, cost: number | null;
		try {
			price = money(form.get('price')) ?? 0;
			compareAtPrice = money(form.get('compareAtPrice'));
			cost = money(form.get('cost'));
		} catch (e) {
			return fail(400, { error: (e as Error).message });
		}
		if (compareAtPrice !== null && compareAtPrice <= price)
			return fail(400, {
				error: 'Compare-at price must be higher than the price to show a discount.'
			});

		const options: OptionInput[] = JSON.parse(String(form.get('options') ?? '[]'))
			.map((o: OptionInput) => ({
				name: o.name.trim(),
				values: [...new Set(o.values.map((v) => v.trim()).filter(Boolean))]
			}))
			.filter((o: OptionInput) => o.name && o.values.length)
			.slice(0, 2);

		const variantInputs: VariantInput[] = JSON.parse(String(form.get('variants') ?? '[]'));
		const hasVariants = options.length > 0;

		const taken = await db
			.select({ slug: products.slug })
			.from(products)
			.where(isNew ? undefined : ne(products.id, params.id));

		const values = {
			title,
			titleBn: String(form.get('titleBn') ?? '').trim() || null,
			slug: uniqueSlug(
				slugify(String(form.get('slug') ?? '').trim() || title),
				new Set(taken.map((t) => t.slug))
			),
			description: String(form.get('description') ?? '').trim() || null,
			descriptionBn: String(form.get('descriptionBn') ?? '').trim() || null,
			brand: String(form.get('brand') ?? '').trim() || null,
			status: String(form.get('status') ?? 'draft') as 'draft' | 'active' | 'archived',
			price,
			compareAtPrice,
			cost,
			stock: hasVariants ? 0 : Number(form.get('stock') ?? 0),
			hasVariants,
			featured: form.get('featured') === 'on',
			seoTitle: String(form.get('seoTitle') ?? '').trim() || null,
			seoDescription: String(form.get('seoDescription') ?? '').trim() || null,
			updatedAt: new Date()
		};

		const imageUrls = String(form.get('images') ?? '')
			.split(',')
			.filter(Boolean);
		const categoryIds = form.getAll('categories').map(String).filter(Boolean);

		const id = await db.transaction(async (tx) => {
			const productId = isNew
				? (await tx.insert(products).values(values).returning({ id: products.id }))[0].id
				: (
						await tx
							.update(products)
							.set(values)
							.where(eq(products.id, params.id))
							.returning({ id: products.id })
					)[0].id;

			// Images and category links are small sets — replace rather than diff.
			await tx.delete(productImages).where(eq(productImages.productId, productId));
			if (imageUrls.length)
				await tx
					.insert(productImages)
					.values(imageUrls.map((url, sort) => ({ productId, url, sort })));

			await tx.delete(productCategories).where(eq(productCategories.productId, productId));
			if (categoryIds.length)
				await tx
					.insert(productCategories)
					.values(categoryIds.map((categoryId) => ({ productId, categoryId })));

			await tx.delete(productOptions).where(eq(productOptions.productId, productId));
			if (options.length)
				await tx
					.insert(productOptions)
					.values(options.map((o, sort) => ({ productId, name: o.name, values: o.values, sort })));

			// Rebuild variants from the option grid, carrying over price/stock/sku
			// for combinations that still exist (keyed by their value tuple).
			const existing = await tx.select().from(variants).where(eq(variants.productId, productId));
			const byKey = new Map(existing.map((v) => [keyOf(v.optionValues), v]));
			const edits = new Map(variantInputs.map((v) => [v.key, v]));

			await tx.delete(variants).where(eq(variants.productId, productId));

			if (hasVariants) {
				const rows = combinations(options).map((optionValues) => {
					const key = keyOf(optionValues);
					const edit = edits.get(key);
					const prev = byKey.get(key);
					return {
						productId,
						optionValues,
						sku: edit?.sku?.trim() || prev?.sku || null,
						price: edit?.price ? parseTk(edit.price) : (prev?.price ?? price),
						stock: edit ? Number(edit.stock) || 0 : (prev?.stock ?? 0),
						active: edit ? edit.active : (prev?.active ?? true)
					};
				});
				if (rows.length) await tx.insert(variants).values(rows);
			}

			return productId;
		});

		// Keep the search index in step with the edit. Never throws into a save.
		await reindexProduct(id);

		if (isNew) redirect(303, `/admin/products/${id}`);
		return { ok: true };
	},

	remove: async ({ params }) => {
		if (params.id === 'new') redirect(303, '/admin/products');
		await db.delete(products).where(eq(products.id, params.id));
		await removeProduct(params.id).catch(() => {});
		redirect(303, '/admin/products');
	}
};
