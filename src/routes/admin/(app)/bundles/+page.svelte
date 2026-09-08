<script lang="ts">
	import type { AdminTableFeatures } from '$lib/admin/table';
	import { enhance } from '$app/forms';
	import { renderSnippet } from '@tanstack/svelte-table';
	import type { ColumnDef } from '@tanstack/svelte-table';
	import { Plus, PackagePlus, Power, Trash2, TriangleAlert, Pencil } from '@lucide/svelte';
	import { formatTk } from '$lib/money';
	import Button from '$lib/ui/Button.svelte';
	import Input from '$lib/ui/Input.svelte';
	import Select from '$lib/ui/Select.svelte';
	import Dialog from '$lib/ui/Dialog.svelte';
	import DataTable from '$lib/admin/DataTable.svelte';
	import PageHeader from '$lib/admin/PageHeader.svelte';
	import RowActions from '$lib/admin/RowActions.svelte';
	import MenuItem from '$lib/admin/MenuItem.svelte';
	import { setParams } from '$lib/admin/listQuery';

	let { data, form } = $props();
	type Bundle = (typeof data)['rows'][number];

	let open = $state(false);

	const columns: ColumnDef<AdminTableFeatures, Bundle>[] = [
		{ id: 'bundle', header: 'Bundle', cell: (c) => renderSnippet(bundleCell, c.row.original) },
		{ id: 'price', header: 'Price', cell: (c) => renderSnippet(priceCell, c.row.original) },
		{ id: 'state', header: 'Live', cell: (c) => renderSnippet(stateCell, c.row.original) },
		{ id: 'actions', header: '', cell: (c) => renderSnippet(actionsCell, c.row.original) }
	];
</script>

{#snippet bundleCell(b: Bundle)}
	<a href="/admin/bundles/{b.id}" class="flex items-center gap-3">
		<span
			class="grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-surface-alt"
		>
			{#if b.image}
				<img src={b.image} alt="" class="size-full object-cover" loading="lazy" />
			{:else}
				<PackagePlus size={16} class="text-ink-faint" />
			{/if}
		</span>
		<span class="min-w-0">
			<span class="block truncate text-sm font-medium text-ink">{b.title}</span>
			<span class="block text-xs text-ink-faint">
				<span class="num">{b.items.length}</span> products
				{#if !b.inStock && b.items.length}· part out of stock{/if}
			</span>
		</span>
	</a>
{/snippet}

{#snippet priceCell(b: Bundle)}
	<span class="num text-sm font-semibold text-ink">{formatTk(b.price)}</span>
	{#if b.saving > 0}
		<span class="num block text-xs text-success">saves {formatTk(b.saving)}</span>
	{/if}
{/snippet}

{#snippet stateCell(b: Bundle)}
	{#if b.items.length < 2}
		<!-- A one-product bundle is not an offer, so it never goes live. -->
		<span class="flex items-center gap-1.5 text-xs">
			<TriangleAlert size={13} class="text-warn-fg" />
			<span class="text-ink">Needs 2+ products</span>
		</span>
	{:else}
		<span class="flex items-center gap-1.5 text-xs">
			<Power size={13} class={b.active ? 'text-ok-fg' : 'text-ink-faint'} />
			<span class="text-ink">{b.active ? 'Live' : 'Off'}</span>
		</span>
	{/if}
{/snippet}

{#snippet actionsCell(b: Bundle)}
	<div class="flex justify-end">
		<RowActions label="Actions for {b.title}">
			{#snippet menu()}
				<MenuItem href="/admin/bundles/{b.id}">
					<Pencil size={15} />
					Edit
				</MenuItem>
				<form method="POST" action="?/toggle" use:enhance>
					<input type="hidden" name="id" value={b.id} />
					<MenuItem>
						<Power size={15} />
						{b.active ? 'Switch off' : 'Switch on'}
					</MenuItem>
				</form>
				<form method="POST" action="?/remove" use:enhance>
					<input type="hidden" name="id" value={b.id} />
					<MenuItem danger>
						<Trash2 size={15} />
						Delete
					</MenuItem>
				</form>
			{/snippet}
		</RowActions>
	</div>
{/snippet}

<svelte:head><title>Bundles · Admin</title></svelte:head>

<PageHeader
	title="Bundles"
	count={data.total}
	description="Sets of products sold together for one price. They appear on the product page of everything they contain."
>
	{#snippet actions()}
		<Button size="sm" onclick={() => (open = true)}>
			<Plus size={15} />
			New bundle
		</Button>
	{/snippet}
</PageHeader>

{#if form?.error}
	<p
		class="mt-4 rounded-2xl border border-sale/30 bg-sale/8 px-4 py-3 text-sm text-sale"
		role="alert"
	>
		{form.error}
	</p>
{/if}

<div class="mt-6">
	<DataTable
		{columns}
		rows={data.rows}
		total={data.total}
		page={data.page}
		perPage={data.perPage}
		q={data.filters.q}
		rowId={(b) => b.id}
		searchPlaceholder="Bundle name"
		empty="No bundles match this view."
	>
		{#snippet filters()}
			<Select
				value={data.filters.status}
				class="w-48"
				options={[
					{ value: '', label: 'All bundles' },
					{ value: 'active', label: 'Live' },
					{ value: 'off', label: 'Switched off' },
					{ value: 'incomplete', label: 'Needs products' }
				]}
				onchange={(v) => setParams({ status: v })}
			/>
		{/snippet}
	</DataTable>
</div>

<Dialog bind:open title="New bundle">
	<form id="bundle-form" method="POST" action="?/create" use:enhance class="flex flex-col gap-4">
		<Input label="Name" name="title" required placeholder="Breakfast essentials" />
	</form>
	{#snippet footer()}
		<Button variant="secondary" onclick={() => (open = false)}>Cancel</Button>
		<Button type="submit" form="bundle-form">Create</Button>
	{/snippet}
</Dialog>
