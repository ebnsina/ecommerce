<script lang="ts">
	import type { AdminTableFeatures } from '$lib/admin/table';
	import { enhance } from '$app/forms';
	import { renderSnippet } from '@tanstack/svelte-table';
	import type { ColumnDef } from '@tanstack/svelte-table';
	import { Plus, Pencil, Trash2, Power, TicketPercent } from '@lucide/svelte';
	import { formatTk } from '$lib/money';
	import Button from '$lib/ui/Button.svelte';
	import Input from '$lib/ui/Input.svelte';
	import Select from '$lib/ui/Select.svelte';
	import Checkbox from '$lib/ui/Checkbox.svelte';
	import Dialog from '$lib/ui/Dialog.svelte';
	import DataTable from '$lib/admin/DataTable.svelte';
	import PageHeader from '$lib/admin/PageHeader.svelte';
	import RowActions from '$lib/admin/RowActions.svelte';
	import MenuItem from '$lib/admin/MenuItem.svelte';
	import { setParams } from '$lib/admin/listQuery';

	type Row = (typeof data)['rows'][number];

	let { data, form } = $props();

	let open = $state(false);
	let editing = $state<Row | null>(null);
	let code = $state('');
	let type = $state('percent');
	let value = $state('');
	let minOrder = $state('0');
	let usageLimit = $state('');
	let perCustomerLimit = $state('1');
	let startsAt = $state('');
	let endsAt = $state('');
	let active = $state(true);

	const forInput = (d: Date | string | null) => (d ? new Date(d).toISOString().slice(0, 16) : '');

	function start(row: Row | null) {
		editing = row;
		code = row?.code ?? '';
		type = row?.type ?? 'percent';
		value = row ? (row.type === 'percent' ? String(row.value) : String(row.value / 100)) : '';
		minOrder = row ? String(row.minOrder / 100) : '0';
		usageLimit = row?.usageLimit ? String(row.usageLimit) : '';
		perCustomerLimit = String(row?.perCustomerLimit ?? 1);
		startsAt = forInput(row?.startsAt ?? null);
		endsAt = forInput(row?.endsAt ?? null);
		active = row?.active ?? true;
		open = true;
	}

	const describe = (c: Row) =>
		c.type === 'percent'
			? `${c.value}% off`
			: c.type === 'fixed'
				? `${formatTk(c.value)} off`
				: 'Free delivery';

	const window = (c: Row) => {
		const f = (d: Date | string | null) =>
			d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : null;
		const a = f(c.startsAt);
		const b = f(c.endsAt);
		if (a && b) return `${a} – ${b}`;
		if (b) return `until ${b}`;
		if (a) return `from ${a}`;
		return 'always';
	};

	const columns: ColumnDef<AdminTableFeatures, Row>[] = [
		{ id: 'code', header: 'Code', cell: (c) => renderSnippet(codeCell, c.row.original) },
		{ id: 'window', header: 'Runs', cell: (c) => renderSnippet(windowCell, c.row.original) },
		{ id: 'minimum', header: 'Minimum', cell: (c) => renderSnippet(minCell, c.row.original) },
		{ id: 'used', header: 'Used', cell: (c) => renderSnippet(usedCell, c.row.original) },
		{ id: 'state', header: 'Live', cell: (c) => renderSnippet(stateCell, c.row.original) },
		{ id: 'actions', header: '', cell: (c) => renderSnippet(actionsCell, c.row.original) }
	];
</script>

{#snippet codeCell(c: Row)}
	<span class="flex items-center gap-2.5">
		<span class="grid size-9 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
			<TicketPercent size={16} />
		</span>
		<span>
			<span class="num block text-sm font-semibold text-ink">{c.code}</span>
			<span class="block text-xs text-ink-muted">{describe(c)}</span>
		</span>
	</span>
{/snippet}

{#snippet windowCell(c: Row)}
	<span class="text-xs text-ink-muted">{window(c)}</span>
{/snippet}

{#snippet minCell(c: Row)}
	<span class="text-xs text-ink-muted">
		{c.minOrder > 0 ? formatTk(c.minOrder) : 'none'}
	</span>
{/snippet}

{#snippet usedCell(c: Row)}
	<span class="num text-xs text-ink-muted">
		{c.usedCount}{c.usageLimit ? ` / ${c.usageLimit}` : ''}
	</span>
{/snippet}

{#snippet stateCell(c: Row)}
	<span class="flex items-center gap-1.5 text-xs">
		<Power size={13} class={c.active ? 'text-ok-fg' : 'text-ink-faint'} />
		<span class="text-ink">{c.active ? 'Live' : 'Off'}</span>
	</span>
{/snippet}

{#snippet actionsCell(c: Row)}
	<div class="flex justify-end">
		<RowActions label="Actions for {c.code}">
			{#snippet menu({ close })}
				<MenuItem
					onclick={() => {
						start(c);
						close();
					}}
				>
					<Pencil size={15} />
					Edit
				</MenuItem>
				<form method="POST" action="?/toggle" use:enhance>
					<input type="hidden" name="id" value={c.id} />
					<MenuItem>
						<Power size={15} />
						{c.active ? 'Switch off' : 'Switch on'}
					</MenuItem>
				</form>
				<form method="POST" action="?/remove" use:enhance>
					<input type="hidden" name="id" value={c.id} />
					<MenuItem danger>
						<Trash2 size={15} />
						Delete
					</MenuItem>
				</form>
			{/snippet}
		</RowActions>
	</div>
{/snippet}

<svelte:head><title>Coupons · Admin</title></svelte:head>

<PageHeader
	title="Coupons"
	count={data.total}
	description="Discount codes customers type at checkout."
>
	{#snippet actions()}
		<Button size="sm" onclick={() => start(null)}>
			<Plus size={15} />
			New coupon
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
		rowId={(c) => c.id}
		searchPlaceholder="Coupon code"
		empty="No coupons match this view."
	>
		{#snippet filters()}
			<Select
				value={data.filters.status}
				class="w-40"
				options={[
					{ value: '', label: 'All coupons' },
					{ value: 'active', label: 'Live' },
					{ value: 'off', label: 'Switched off' }
				]}
				onchange={(v) => setParams({ status: v })}
			/>
		{/snippet}
	</DataTable>
</div>

<Dialog bind:open title={editing ? `Edit ${editing.code}` : 'New coupon'}>
	<form
		id="coupon-form"
		method="POST"
		action="?/save"
		use:enhance={() =>
			({ update }) => {
				open = false;
				return update();
			}}
		class="flex flex-col gap-4"
	>
		{#if editing}<input type="hidden" name="id" value={editing.id} />{/if}

		<Input
			label="Code"
			name="code"
			bind:value={code}
			placeholder="EID25"
			hint="Customers type this. Letters, digits, - and _."
		/>

		<Select
			label="Discount type"
			name="type"
			bind:value={type}
			options={[
				{ value: 'percent', label: 'Percentage off' },
				{ value: 'fixed', label: 'Fixed amount off' },
				{ value: 'free_shipping', label: 'Free delivery' }
			]}
		/>

		{#if type !== 'free_shipping'}
			<Input
				label={type === 'percent' ? 'Percent off' : 'Amount off (৳)'}
				name="value"
				bind:value
				numeric
				inputmode="decimal"
			/>
		{/if}

		<div class="grid gap-4 sm:grid-cols-2">
			<Input
				label="Minimum order (৳)"
				name="minOrder"
				bind:value={minOrder}
				numeric
				inputmode="decimal"
			/>
			<Input
				label="Total uses"
				name="usageLimit"
				bind:value={usageLimit}
				numeric
				type="number"
				min="1"
				hint="Empty means unlimited."
			/>
		</div>

		<Input
			label="Uses per customer"
			name="perCustomerLimit"
			bind:value={perCustomerLimit}
			numeric
			type="number"
			min="1"
		/>

		<div class="grid gap-4 sm:grid-cols-2">
			<Input label="Starts" name="startsAt" type="datetime-local" bind:value={startsAt} />
			<Input label="Ends" name="endsAt" type="datetime-local" bind:value={endsAt} />
		</div>

		<Checkbox name="active" bind:checked={active} label="Active" />
	</form>

	{#snippet footer()}
		<Button variant="secondary" onclick={() => (open = false)}>Cancel</Button>
		<Button type="submit" form="coupon-form">{editing ? 'Save coupon' : 'Create coupon'}</Button>
	{/snippet}
</Dialog>
