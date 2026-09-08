<script lang="ts">
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import { slide } from 'svelte/transition';
	import { Plus, Trash2, ArrowLeft } from '@lucide/svelte';
	import { slugify } from '$lib/slug';
	import { formatTk } from '$lib/money';
	import { slideOpen } from '$lib/motion';
	import Button from '$lib/ui/Button.svelte';
	import Input from '$lib/ui/Input.svelte';
	import Textarea from '$lib/ui/Textarea.svelte';
	import Select from '$lib/ui/Select.svelte';
	import Checkbox from '$lib/ui/Checkbox.svelte';
	import MediaPicker from '$lib/ui/MediaPicker.svelte';

	let { data, form } = $props();

	/* Snapshot for form defaults — these fields are owned by the form after load,
	   so they must not re-bind on every navigation. */
	const init = untrack(() => data);

	const isNew = $derived(data.product.id === '');

	/* ── fields ─────────────────────────────────────────────────────── */
	let title = $state(init.product.title);
	let titleBn = $state(init.product.titleBn ?? '');
	let slug = $state(init.product.slug);
	let slugTouched = $state(!!init.product.slug);
	let description = $state(init.product.description ?? '');
	let brand = $state(init.product.brand ?? '');
	let status = $state(init.product.status);
	const taka = (v: number | null | undefined) => (v ? String(v / 100) : '');
	let price = $state(taka(init.product.price));
	let compareAt = $state(taka(init.product.compareAtPrice));
	let cost = $state(taka(init.product.cost));
	let stock = $state(String(init.product.stock ?? 0));
	let featured = $state(init.product.featured);
	let seoTitle = $state(init.product.seoTitle ?? '');
	let seoDescription = $state(init.product.seoDescription ?? '');
	let images = $state<string[]>(init.images);
	let selected = $state<string[]>(init.selected);

	const autoSlug = $derived(slugTouched ? slug : slugify(title));

	/* ── options & variants ─────────────────────────────────────────── */
	type Opt = { name: string; raw: string };
	let options = $state<Opt[]>(
		init.options.map((o) => ({ name: o.name, values: o.values, raw: o.values.join(', ') }))
	);

	const parsedOptions = $derived(
		options
			.map((o) => ({
				name: o.name.trim(),
				values: o.raw
					.split(',')
					.map((v) => v.trim())
					.filter(Boolean)
			}))
			.filter((o) => o.name && o.values.length)
	);

	/** Cartesian product — same rule the server applies on save. */
	const combos = $derived(
		parsedOptions
			.reduce<Record<string, string>[]>(
				(acc, opt) => acc.flatMap((row) => opt.values.map((v) => ({ ...row, [opt.name]: v }))),
				[{}]
			)
			.filter(() => parsedOptions.length > 0)
	);

	const keyOf = (v: Record<string, string>) => Object.values(v).join(' / ');

	/* Edits keyed by combination so retyping an option keeps what you entered. */
	let edits = $state<
		Record<string, { sku: string; price: string; stock: number; active: boolean }>
	>(
		Object.fromEntries(
			init.variants.map((v) => [
				keyOf(v.optionValues),
				{ sku: v.sku ?? '', price: String(v.price / 100), stock: v.stock, active: v.active }
			])
		)
	);

	/* Rows are derived (defaults filled in); edits only holds what was typed.
	   Binding straight into `edits` would mean mutating state during render. */
	const rows = $derived(
		combos.map((c) => {
			const key = keyOf(c);
			const e = edits[key];
			return {
				key,
				sku: e?.sku ?? '',
				price: e?.price ?? price ?? '0',
				stock: e?.stock ?? 0,
				active: e?.active ?? true
			};
		})
	);

	function set(key: string, patch: Partial<(typeof rows)[number]>) {
		const row = rows.find((r) => r.key === key)!;
		edits[key] = { sku: row.sku, price: row.price, stock: row.stock, active: row.active, ...patch };
	}

	const variantPayload = $derived(JSON.stringify(rows));
	const optionPayload = $derived(JSON.stringify(parsedOptions));

	const categoryOptions = $derived(
		data.categories.map((c) => ({
			...c,
			label: c.parentId ? `— ${c.name}` : c.name
		}))
	);
</script>

<svelte:head><title>{isNew ? 'New product' : title} · Admin</title></svelte:head>

<a
	href="/admin/products"
	class="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
>
	<ArrowLeft size={15} />
	All products
</a>

<form method="POST" action="?/save" use:enhance class="mt-3">
	<div class="flex flex-wrap items-start justify-between gap-4">
		<div class="min-w-0">
			<h1 class="truncate text-2xl font-semibold tracking-tight text-ink">
				{title || 'New product'}
			</h1>
			{#if !isNew}
				<p class="mt-1 text-sm text-ink-faint">/{data.product.slug}</p>
			{/if}
		</div>
		<div class="flex gap-2">
			{#if !isNew}
				<Button variant="danger" formaction="?/remove">
					<Trash2 size={16} />
					Delete
				</Button>
			{/if}
			<Button type="submit">{isNew ? 'Create product' : 'Save changes'}</Button>
		</div>
	</div>

	{#if form?.error}
		<p
			class="mt-4 rounded-2xl border border-sale/30 bg-sale/8 px-4 py-3 text-sm text-sale"
			role="alert"
		>
			{form.error}
		</p>
	{/if}

	<!-- hidden payloads -->
	<input type="hidden" name="options" value={optionPayload} />
	<input type="hidden" name="variants" value={variantPayload} />
	<input type="hidden" name="images" value={images.join(',')} />
	<input type="hidden" name="status" value={status} />

	<div class="mt-6 grid gap-4 lg:grid-cols-3">
		<div class="flex flex-col gap-4 lg:col-span-2">
			<section class="rounded-3xl border border-border bg-surface p-5">
				<h2 class="mb-4 text-sm font-medium text-ink">Basics</h2>
				<div class="flex flex-col gap-4">
					<div class="grid gap-4 sm:grid-cols-2">
						<Input label="Title" name="title" bind:value={title} required autocomplete="off" />
						<Input label="Title (Bangla)" name="titleBn" bind:value={titleBn} autocomplete="off" />
					</div>
					<Input
						label="Slug"
						name="slug"
						value={autoSlug}
						oninput={(e) => {
							slugTouched = true;
							slug = e.currentTarget.value;
						}}
					/>
					<Textarea label="Description" name="description" bind:value={description} rows={5} />
					<Input label="Brand" name="brand" bind:value={brand} autocomplete="off" />
				</div>
			</section>

			<section class="rounded-3xl border border-border bg-surface p-5">
				<h2 class="mb-4 text-sm font-medium text-ink">Images</h2>
				<MediaPicker bind:value={images} multiple />
				<p class="mt-2 text-xs text-ink-faint">
					The first image is the one shoppers see in listings.
				</p>
			</section>

			<section class="rounded-3xl border border-border bg-surface p-5">
				<div class="flex items-center justify-between">
					<div>
						<h2 class="text-sm font-medium text-ink">Options &amp; variants</h2>
						<p class="mt-0.5 text-xs text-ink-muted">
							Up to two options, e.g. Size and Colour. Leave empty for a single-SKU product.
						</p>
					</div>
					{#if options.length < 2}
						<Button
							size="sm"
							variant="secondary"
							onclick={() => (options = [...options, { name: '', raw: '' }])}
						>
							<Plus size={15} />
							Add option
						</Button>
					{/if}
				</div>

				{#each options as opt, i (i)}
					<div
						class="mt-4 flex items-end gap-3 rounded-2xl border border-border p-3"
						transition:slide={slideOpen()}
					>
						<Input label="Option name" placeholder="Size" bind:value={opt.name} class="w-40" />
						<Input
							label="Values"
							placeholder="S, M, L, XL"
							bind:value={opt.raw}
							hint="Separate with commas"
							class="flex-1"
						/>
						<button
							type="button"
							class="mb-6 grid size-9 place-items-center rounded-xl text-ink-faint transition-colors hover:bg-sale/8 hover:text-sale"
							aria-label="Remove option"
							onclick={() => (options = options.filter((_, j) => j !== i))}
						>
							<Trash2 size={16} />
						</button>
					</div>
				{/each}

				{#if rows.length}
					<div
						class="mt-4 overflow-hidden rounded-2xl border border-border"
						transition:slide={slideOpen()}
					>
						<table class="w-full text-sm">
							<thead>
								<tr class="border-b border-border bg-surface-alt text-left text-xs text-ink-muted">
									<th class="px-3 py-2 font-medium">Variant</th>
									<th class="px-3 py-2 font-medium">SKU</th>
									<th class="px-3 py-2 font-medium">Price (৳)</th>
									<th class="px-3 py-2 font-medium">Stock</th>
									<th class="px-3 py-2 font-medium">Active</th>
								</tr>
							</thead>
							<tbody>
								{#each rows as r (r.key)}
									<tr class="border-b border-border last:border-0">
										<td class="px-3 py-2 text-sm font-medium text-ink">{r.key}</td>
										<td class="px-3 py-2">
											<input
												class="h-9 w-28 rounded-lg border border-border px-2 text-sm"
												value={r.sku}
												oninput={(e) => set(r.key, { sku: e.currentTarget.value })}
											/>
										</td>
										<td class="px-3 py-2">
											<input
												class="num h-9 w-24 rounded-lg border border-border px-2 text-sm"
												inputmode="decimal"
												value={r.price}
												oninput={(e) => set(r.key, { price: e.currentTarget.value })}
											/>
										</td>
										<td class="px-3 py-2">
											<input
												class="num h-9 w-20 rounded-lg border border-border px-2 text-sm"
												type="number"
												min="0"
												value={r.stock}
												oninput={(e) => set(r.key, { stock: Number(e.currentTarget.value) })}
											/>
										</td>
										<td class="px-3 py-2">
											<Checkbox
												checked={r.active}
												onchange={(e) => set(r.key, { active: e.currentTarget.checked })}
											/>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			</section>

			<section class="rounded-3xl border border-border bg-surface p-5">
				<h2 class="mb-4 text-sm font-medium text-ink">Search engine listing</h2>
				<div class="flex flex-col gap-4">
					<Input label="SEO title" name="seoTitle" bind:value={seoTitle} placeholder={title} />
					<Textarea
						label="SEO description"
						name="seoDescription"
						bind:value={seoDescription}
						rows={3}
					/>
				</div>
			</section>
		</div>

		<div class="flex flex-col gap-4">
			<section class="rounded-3xl border border-border bg-surface p-5">
				<h2 class="mb-4 text-sm font-medium text-ink">Status</h2>
				<Select
					bind:value={status}
					options={[
						{ value: 'draft', label: 'Draft', hint: 'Not visible to shoppers' },
						{ value: 'active', label: 'Active', hint: 'Live on the storefront' },
						{ value: 'archived', label: 'Archived', hint: 'Hidden, kept for records' }
					]}
				/>
				<div class="mt-4">
					<Checkbox
						name="featured"
						bind:checked={featured}
						label="Featured"
						hint="Eligible for the Featured block on the homepage."
					/>
				</div>
			</section>

			<section class="rounded-3xl border border-border bg-surface p-5">
				<h2 class="mb-4 text-sm font-medium text-ink">Pricing</h2>
				<div class="flex flex-col gap-4">
					<Input
						label="Price"
						name="price"
						bind:value={price}
						numeric
						inputmode="decimal"
						required
					/>
					<Input
						label="Compare-at price"
						name="compareAtPrice"
						bind:value={compareAt}
						numeric
						inputmode="decimal"
						hint="Shown struck through. Must be higher than the price."
					/>
					<Input
						label="Cost"
						name="cost"
						bind:value={cost}
						numeric
						inputmode="decimal"
						hint="Yours only — never shown to shoppers."
					/>
					{#if !parsedOptions.length}
						<Input label="Stock" name="stock" bind:value={stock} numeric type="number" min="0" />
					{:else}
						<p class="text-xs text-ink-muted">Stock is tracked per variant.</p>
					{/if}
				</div>
			</section>

			<section class="rounded-3xl border border-border bg-surface p-5">
				<h2 class="mb-4 text-sm font-medium text-ink">Categories</h2>
				{#if categoryOptions.length}
					<div class="flex max-h-64 flex-col gap-2.5 overflow-y-auto">
						{#each categoryOptions as c (c.id)}
							<label class="flex cursor-pointer items-center gap-2.5">
								<input
									type="checkbox"
									name="categories"
									value={c.id}
									checked={selected.includes(c.id)}
									onchange={(e) =>
										(selected = e.currentTarget.checked
											? [...selected, c.id]
											: selected.filter((id) => id !== c.id))}
									class="peer sr-only"
								/>
								<span
									class="grid size-5 shrink-0 place-items-center rounded-md border border-border transition-colors
									       peer-checked:border-primary peer-checked:bg-primary
									       peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary"
								>
									<span class="size-2 rounded-[3px] bg-white opacity-0 peer-checked:opacity-100"
									></span>
								</span>
								<span class="text-sm text-ink">{c.label}</span>
							</label>
						{/each}
					</div>
				{:else}
					<p class="text-sm text-ink-faint">
						No categories yet. <a href="/admin/categories" class="text-primary">Create one</a>.
					</p>
				{/if}
			</section>
		</div>
	</div>
</form>
