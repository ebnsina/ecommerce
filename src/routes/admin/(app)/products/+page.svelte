<script lang="ts">
	import { page } from '$app/state';
	import { renderSnippet } from '@tanstack/svelte-table';
	import type { ColumnDef } from '@tanstack/svelte-table';
	import {
		Plus,
		Package,
		Star,
		Upload,
		Download,
		CircleCheck,
		PencilLine,
		Archive,
		Pencil,
		ExternalLink
	} from '@lucide/svelte';
	import { formatTk } from '$lib/money';
	import Button from '$lib/ui/Button.svelte';
	import Select from '$lib/ui/Select.svelte';
	import DataTable from '$lib/admin/DataTable.svelte';
	import PageHeader from '$lib/admin/PageHeader.svelte';
	import RowActions from '$lib/admin/RowActions.svelte';
	import MenuItem from '$lib/admin/MenuItem.svelte';
	import { setParams } from '$lib/admin/listQuery';

	let { data } = $props();
	type Product = (typeof data)['rows'][number];

	/* Neutral tag, colour carried by the icon — same rule as the order status badge. */
	const statusTone: Record<string, { Icon: typeof CircleCheck; color: string }> = {
		active: { Icon: CircleCheck, color: 'var(--color-ok-fg)' },
		draft: { Icon: PencilLine, color: 'var(--color-ink-faint)' },
		archived: { Icon: Archive, color: 'var(--color-bad-fg)' }
	};

	const columns: ColumnDef<any, Product>[] = [
		{ id: 'product', header: 'Product', cell: (c) => renderSnippet(productCell, c.row.original) },
		{ id: 'status', header: 'Status', cell: (c) => renderSnippet(statusCell, c.row.original) },
		{ id: 'price', header: 'Price', cell: (c) => renderSnippet(priceCell, c.row.original) },
		{ id: 'stock', header: 'Stock', cell: (c) => renderSnippet(stockCell, c.row.original) },
		{ id: 'actions', header: '', cell: (c) => renderSnippet(actionsCell, c.row.original) }
	];
</script>

{#snippet productCell(p: Product)}
	<a href="/admin/products/{p.id}" class="flex items-center gap-3">
		<span
			class="grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-surface-alt"
		>
			{#if p.image}
				<img src={p.image} alt="" class="size-full object-cover" loading="lazy" />
			{:else}
				<Package size={16} class="text-ink-faint" />
			{/if}
		</span>
		<span class="min-w-0">
			<span class="flex items-center gap-1.5 text-sm font-medium text-ink">
				<span class="truncate">{p.title}</span>
				{#if p.featured}
					<Star size={13} class="shrink-0 fill-warn-fg text-warn-fg" />
					<span class="sr-only">Featured</span>
				{/if}
			</span>
			<span class="block truncate text-xs text-ink-faint">/{p.slug}</span>
		</span>
	</a>
{/snippet}

{#snippet statusCell(p: Product)}
	{@const tone = statusTone[p.status] ?? statusTone.draft}
	<span
		class="inline-flex items-center gap-1.5 rounded-lg border border-border px-2 py-1 text-xs text-ink"
	>
		<tone.Icon size={13} style="color: {tone.color}" />
		{p.status}
	</span>
{/snippet}

{#snippet priceCell(p: Product)}
	<span class="num font-medium text-ink">{formatTk(p.price)}</span>
	{#if p.compareAtPrice}
		<span class="num block text-xs text-ink-faint line-through">{formatTk(p.compareAtPrice)}</span>
	{/if}
{/snippet}

{#snippet stockCell(p: Product)}
	{#if p.hasVariants}
		<span class="text-xs text-ink-muted">By variant</span>
	{:else}
		<span class="num text-sm {p.stock <= 5 ? 'font-medium text-sale' : 'text-ink'}">{p.stock}</span>
	{/if}
{/snippet}

{#snippet actionsCell(p: Product)}
	<div class="flex justify-end">
		<RowActions label="Actions for {p.title}">
			{#snippet menu()}
				<MenuItem href="/admin/products/{p.id}">
					<Pencil size={15} />
					Edit
				</MenuItem>
				<MenuItem href="/p/{p.slug}">
					<ExternalLink size={15} />
					See it in the shop
				</MenuItem>
			{/snippet}
		</RowActions>
	</div>
{/snippet}

<svelte:head><title>Products · Admin</title></svelte:head>

<PageHeader
	title="Products"
	count={data.total}
	description={data.filters.lowStock ? 'Showing low stock only.' : 'Everything you sell.'}
>
	{#snippet actions()}
		<Button variant="secondary" size="sm" href="/admin/products/export{page.url.search}">
			<Download size={15} />
			Export
		</Button>
		<Button variant="secondary" size="sm" href="/admin/products/import">
			<Upload size={15} />
			Import
		</Button>
		<Button size="sm" href="/admin/products/new">
			<Plus size={15} />
			New product
		</Button>
	{/snippet}
</PageHeader>

<div class="mt-6">
	<DataTable
		{columns}
		rows={data.rows}
		total={data.total}
		page={data.page}
		perPage={data.perPage}
		q={data.filters.q}
		rowId={(p) => p.id}
		searchPlaceholder="Title or slug"
		empty="No products match this view."
	>
		{#snippet filters()}
			<Select
				value={data.filters.status}
				class="w-40"
				options={[
					{ value: '', label: 'All statuses' },
					{ value: 'active', label: 'Active' },
					{ value: 'draft', label: 'Draft' },
					{ value: 'archived', label: 'Archived' }
				]}
				onchange={(v) => setParams({ status: v })}
			/>
			<Select
				value={data.filters.categoryId}
				class="w-52"
				options={[
					{ value: '', label: 'All categories' },
					...data.categories.map((c) => ({ value: c.id, label: c.name }))
				]}
				onchange={(v) => setParams({ category: v })}
			/>
		{/snippet}
	</DataTable>
</div>
