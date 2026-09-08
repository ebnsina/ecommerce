<script lang="ts">
	import { enhance } from '$app/forms';
	import { renderSnippet } from '@tanstack/svelte-table';
	import type { ColumnDef } from '@tanstack/svelte-table';
	import { Send, Check, TriangleAlert, Phone, Settings } from '@lucide/svelte';
	import { formatTk } from '$lib/money';
	import { formatPhone } from '$lib/phone';
	import Button from '$lib/ui/Button.svelte';
	import DataTable from '$lib/admin/DataTable.svelte';
	import PageHeader from '$lib/admin/PageHeader.svelte';
	import RowActions from '$lib/admin/RowActions.svelte';
	import MenuItem from '$lib/admin/MenuItem.svelte';

	let { data, form } = $props();
	type Cart = (typeof data)['rows'][number];

	const ago = (d: Date | string) => {
		const hours = Math.round((Date.now() - new Date(d).getTime()) / 3600_000);
		return hours < 24 ? `${hours}h ago` : `${Math.round(hours / 24)}d ago`;
	};

	const columns: ColumnDef<any, Cart>[] = [
		{ id: 'shopper', header: 'Shopper', cell: (c) => renderSnippet(shopperCell, c.row.original) },
		{ id: 'value', header: 'Value', cell: (c) => renderSnippet(valueCell, c.row.original) },
		{ id: 'items', header: 'Items', cell: (c) => renderSnippet(itemsCell, c.row.original) },
		{ id: 'quiet', header: 'Quiet for', cell: (c) => renderSnippet(quietCell, c.row.original) },
		{
			id: 'reminded',
			header: 'Reminder',
			cell: (c) => renderSnippet(remindedCell, c.row.original)
		},
		{ id: 'actions', header: '', cell: (c) => renderSnippet(actionsCell, c.row.original) }
	];
</script>

{#snippet shopperCell(c: Cart)}
	<span class="block text-sm font-medium text-ink">{c.name || 'No name given'}</span>
	<span class="num block text-xs text-ink-faint">{formatPhone(c.phone)}</span>
{/snippet}

{#snippet valueCell(c: Cart)}
	<span class="num text-sm font-semibold text-ink">{formatTk(Number(c.value))}</span>
{/snippet}

{#snippet itemsCell(c: Cart)}
	<span class="num text-sm text-ink-muted">{c.items}</span>
{/snippet}

{#snippet quietCell(c: Cart)}
	<span class="text-xs text-ink-muted">{ago(c.updatedAt)}</span>
{/snippet}

{#snippet remindedCell(c: Cart)}
	<span class="flex items-center gap-1.5 text-xs">
		{#if c.remindedAt}
			<Check size={14} class="text-ok-fg" />
			<span class="text-ink">Sent {ago(c.remindedAt)}</span>
		{:else}
			<span class="text-ink-faint">Not sent</span>
		{/if}
	</span>
{/snippet}

{#snippet actionsCell(c: Cart)}
	<div class="flex justify-end">
		<RowActions label="Actions for this cart">
			{#snippet menu()}
				<form method="POST" action="?/remind" use:enhance>
					<input type="hidden" name="id" value={c.id} />
					<MenuItem>
						<Send size={15} />
						{c.remindedAt ? 'Remind again' : 'Send a reminder'}
					</MenuItem>
				</form>
				<MenuItem href="tel:{c.phone}">
					<Phone size={15} />
					Call instead
				</MenuItem>
			{/snippet}
		</RowActions>
	</div>
{/snippet}

<svelte:head><title>Abandoned carts · Admin</title></svelte:head>

<PageHeader
	title="Abandoned carts"
	count={data.total}
	description="Shoppers who gave their number at checkout but never finished. Quiet for over {data
		.recovery.delayHours} hours."
>
	{#snippet actions()}
		<span class="num rounded-xl border border-border px-3 py-2 text-sm font-semibold text-ink">
			{formatTk(data.value)} waiting
		</span>
		<Button variant="secondary" size="sm" href="/admin/settings">
			<Settings size={15} />
			Reminder settings
		</Button>
	{/snippet}
</PageHeader>

{#if !data.recovery.enabled}
	<p
		class="mt-4 flex items-center gap-2 rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-ink"
	>
		<TriangleAlert size={16} class="shrink-0 text-warn-fg" />
		Automatic reminders are off. Switch them on under Settings → Cart reminders, or send one by hand from
		the row menu.
	</p>
{/if}

{#if form?.error}
	<p
		class="mt-4 rounded-2xl border border-sale/30 bg-sale/8 px-4 py-3 text-sm text-sale"
		role="alert"
	>
		{form.error}
	</p>
{:else if form?.sent}
	<p
		class="mt-4 flex items-center gap-2 rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-ink"
	>
		<Check size={16} class="shrink-0 text-ok-fg" />
		Reminder sent to {formatPhone(form.sent)}.
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
		searchPlaceholder="Phone or name"
		empty="No carts left hanging. Everyone who started checkout finished it."
	/>
</div>
