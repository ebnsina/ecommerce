<script lang="ts">
	import type { AdminTableFeatures } from '$lib/admin/table';
	import { page } from '$app/state';
	import { renderComponent, renderSnippet } from '@tanstack/svelte-table';
	import type { ColumnDef } from '@tanstack/svelte-table';
	import { Eye, Printer, Download } from '@lucide/svelte';
	import { formatTk } from '$lib/money';
	import { formatPhone } from '$lib/phone';
	import OrderStatus from '$lib/shop/OrderStatus.svelte';
	import Select from '$lib/ui/Select.svelte';
	import Button from '$lib/ui/Button.svelte';
	import DataTable from '$lib/admin/DataTable.svelte';
	import PageHeader from '$lib/admin/PageHeader.svelte';
	import RowActions from '$lib/admin/RowActions.svelte';
	import MenuItem from '$lib/admin/MenuItem.svelte';
	import { setParams } from '$lib/admin/listQuery';

	let { data } = $props();

	type Order = (typeof data)['rows'][number];

	const day = (d: Date | string) =>
		new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

	const statusOptions = $derived([
		{ value: '', label: 'Every status' },
		{
			value: 'pending',
			label: `Awaiting call${data.counts.pending ? ` (${data.counts.pending})` : ''}`
		},
		{ value: 'confirmed', label: 'Confirmed' },
		{ value: 'packed', label: 'Packed' },
		{ value: 'shipped', label: 'Shipped' },
		{ value: 'delivered', label: 'Delivered' },
		{ value: 'returned', label: 'Returned' },
		{ value: 'cancelled', label: 'Cancelled' }
	]);

	/* Columns hold the data; the snippets below hold the markup, so a cell can
	   use components and still live in the column definition. */
	const columns: ColumnDef<AdminTableFeatures, Order>[] = [
		{ id: 'order', header: 'Order', cell: (c) => renderSnippet(orderCell, c.row.original) },
		{
			id: 'customer',
			header: 'Customer',
			cell: (c) => renderSnippet(customerCell, c.row.original)
		},
		{
			id: 'status',
			header: 'Status',
			cell: (c) => renderComponent(OrderStatus, { status: c.row.original.status })
		},
		{ id: 'payment', header: 'Payment', cell: (c) => renderSnippet(paymentCell, c.row.original) },
		{ id: 'total', header: 'Total', cell: (c) => renderSnippet(totalCell, c.row.original) },
		{ id: 'actions', header: '', cell: (c) => renderSnippet(actionsCell, c.row.original) }
	];
</script>

{#snippet orderCell(o: Order)}
	<a href="/admin/orders/{o.id}" class="num font-medium text-primary">{o.number}</a>
	<span class="block text-xs text-ink-faint">{day(o.createdAt)}</span>
{/snippet}

{#snippet customerCell(o: Order)}
	<span class="block text-ink">{o.name}</span>
	<span class="num block text-xs text-ink-faint">{formatPhone(o.phone)}</span>
{/snippet}

{#snippet paymentCell(o: Order)}
	<span class="text-xs text-ink-muted">
		{o.paymentMethod === 'cod' ? 'COD' : 'Online'} · {o.paymentStatus}
	</span>
{/snippet}

{#snippet totalCell(o: Order)}
	<span class="num font-medium text-ink">{formatTk(o.total)}</span>
{/snippet}

{#snippet actionsCell(o: Order)}
	<div class="flex justify-end">
		<RowActions label="Actions for order {o.number}">
			{#snippet menu()}
				<MenuItem href="/admin/orders/{o.id}">
					<Eye size={15} />
					Open order
				</MenuItem>
				<MenuItem href="/admin/print/{o.id}">
					<Printer size={15} />
					Print invoice
				</MenuItem>
			{/snippet}
		</RowActions>
	</div>
{/snippet}

<svelte:head><title>Orders · Admin</title></svelte:head>

<PageHeader title="Orders" count={data.total} description="Every order, newest first.">
	{#snippet actions()}
		<Button href="/admin/orders/export{page.url.search}" variant="secondary" size="sm">
			<Download size={15} />
			Export CSV
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
		rowId={(o) => o.id}
		searchPlaceholder="Order number, phone or name"
		empty="No orders match this view."
	>
		{#snippet filters()}
			<Select
				value={data.filters.status}
				class="w-52"
				options={statusOptions}
				onchange={(v) => setParams({ status: v })}
			/>
		{/snippet}
	</DataTable>
</div>
