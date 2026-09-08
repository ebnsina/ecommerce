<script lang="ts">
	import { renderSnippet } from '@tanstack/svelte-table';
	import type { ColumnDef } from '@tanstack/svelte-table';
	import { Eye, Phone } from '@lucide/svelte';
	import { formatTk } from '$lib/money';
	import { formatPhone } from '$lib/phone';
	import Select from '$lib/ui/Select.svelte';
	import DataTable from '$lib/admin/DataTable.svelte';
	import PageHeader from '$lib/admin/PageHeader.svelte';
	import RowActions from '$lib/admin/RowActions.svelte';
	import MenuItem from '$lib/admin/MenuItem.svelte';
	import { setParams } from '$lib/admin/listQuery';

	let { data } = $props();
	type Customer = (typeof data)['rows'][number];

	const joined = (d: Date | string) =>
		new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

	const columns: ColumnDef<any, Customer>[] = [
		{
			id: 'customer',
			header: 'Customer',
			cell: (c) => renderSnippet(customerCell, c.row.original)
		},
		{ id: 'tags', header: 'Tags', cell: (c) => renderSnippet(tagsCell, c.row.original) },
		{ id: 'orders', header: 'Orders', cell: (c) => renderSnippet(ordersCell, c.row.original) },
		{ id: 'spent', header: 'Spent', cell: (c) => renderSnippet(spentCell, c.row.original) },
		{ id: 'joined', header: 'Joined', cell: (c) => renderSnippet(joinedCell, c.row.original) },
		{ id: 'actions', header: '', cell: (c) => renderSnippet(actionsCell, c.row.original) }
	];
</script>

{#snippet customerCell(c: Customer)}
	<a href="/admin/customers/{c.id}" class="block">
		<span class="block text-sm font-medium text-ink">{c.name || 'No name yet'}</span>
		<span class="num block text-xs text-ink-faint">{formatPhone(c.phone)}</span>
	</a>
{/snippet}

{#snippet tagsCell(c: Customer)}
	<span class="flex flex-wrap gap-1">
		{#each c.tags ?? [] as tag (tag)}
			<span class="rounded-lg border border-border px-2 py-0.5 text-xs text-ink-muted">{tag}</span>
		{/each}
	</span>
{/snippet}

{#snippet ordersCell(c: Customer)}
	<span class="num text-sm text-ink">{c.orders}</span>
{/snippet}

{#snippet spentCell(c: Customer)}
	<!-- Delivered orders only: an unconfirmed order is not money. -->
	<span class="num text-sm font-medium text-ink">{formatTk(c.spent)}</span>
{/snippet}

{#snippet joinedCell(c: Customer)}
	<span class="text-xs text-ink-muted">{joined(c.createdAt)}</span>
{/snippet}

{#snippet actionsCell(c: Customer)}
	<div class="flex justify-end">
		<RowActions label="Actions for {c.name || c.phone}">
			{#snippet menu()}
				<MenuItem href="/admin/customers/{c.id}">
					<Eye size={15} />
					Open customer
				</MenuItem>
				<MenuItem href="tel:{c.phone}">
					<Phone size={15} />
					Call
				</MenuItem>
			{/snippet}
		</RowActions>
	</div>
{/snippet}

<svelte:head><title>Customers · Admin</title></svelte:head>

<PageHeader
	title="Customers"
	count={data.total}
	description="Everyone who has ordered or signed in."
/>

<div class="mt-6">
	<DataTable
		{columns}
		rows={data.rows}
		total={data.total}
		page={data.page}
		perPage={data.perPage}
		q={data.filters.q}
		rowId={(c) => c.id}
		searchPlaceholder="Phone or name"
		empty="No customers match this view."
	>
		{#snippet filters()}
			{#if data.tags.length}
				<Select
					value={data.filters.tag}
					class="w-44"
					options={[
						{ value: '', label: 'All tags' },
						...data.tags.map((t) => ({ value: t, label: t }))
					]}
					onchange={(v) => setParams({ tag: v })}
				/>
			{/if}
		{/snippet}
	</DataTable>
</div>
