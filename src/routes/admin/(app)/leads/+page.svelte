<script lang="ts">
	import type { AdminTableFeatures } from '$lib/admin/table';
	import { enhance } from '$app/forms';
	import { renderSnippet } from '@tanstack/svelte-table';
	import type { ColumnDef, RowSelectionState } from '@tanstack/svelte-table';
	import { Phone, Trash2, StickyNote, UserPlus, Check, X } from '@lucide/svelte';
	import Select from '$lib/ui/Select.svelte';
	import Button from '$lib/ui/Button.svelte';
	import Tag from '$lib/ui/Tag.svelte';
	import Textarea from '$lib/ui/Textarea.svelte';
	import Dialog from '$lib/ui/Dialog.svelte';
	import DataTable from '$lib/admin/DataTable.svelte';
	import PageHeader from '$lib/admin/PageHeader.svelte';
	import RowActions from '$lib/admin/RowActions.svelte';
	import MenuItem from '$lib/admin/MenuItem.svelte';
	import { setParams } from '$lib/admin/listQuery';
	import { formatPhone } from '$lib/phone';

	let { data, form } = $props();
	type Lead = (typeof data)['rows'][number];

	let selection = $state<RowSelectionState>({});
	let noting = $state<Lead | null>(null);
	let dialogOpen = $state(false);
	$effect(() => {
		if (!dialogOpen) noting = null;
	});
	let noteText = $state('');

	const when = (d: Date | string) =>
		new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

	/* Neutral chip, coloured icon — the same rule as every other status in the
	   admin, so the tone stays legible and the meaning is not carried by hue. */
	const look: Record<string, { label: string; color: string }> = {
		new: { label: 'New', color: 'var(--color-warn-fg)' },
		contacted: { label: 'Called', color: 'var(--color-info-fg)' },
		qualified: { label: 'Interested', color: 'var(--color-ok-fg)' },
		lost: { label: 'Not for them', color: 'var(--color-ink-faint)' }
	};

	const statuses = Object.entries(look).map(([value, s]) => ({ value, label: s.label }));

	function startNote(lead: Lead) {
		noting = lead;
		noteText = lead.note ?? '';
		dialogOpen = true;
	}

	const columns: ColumnDef<AdminTableFeatures, Lead>[] = [
		{ id: 'who', header: 'Who', cell: (c) => renderSnippet(whoCell, c.row.original) },
		{ id: 'shop', header: 'Shop', cell: (c) => renderSnippet(shopCell, c.row.original) },
		{ id: 'status', header: 'Status', cell: (c) => renderSnippet(statusCell, c.row.original) },
		{ id: 'actions', header: '', cell: (c) => renderSnippet(actionsCell, c.row.original) }
	];
</script>

{#snippet whoCell(lead: Lead)}
	<div>
		<span class="block text-sm font-medium text-ink">{lead.name}</span>
		<a href="tel:{lead.phone}" class="num block text-xs text-primary hover:underline">
			{formatPhone(lead.phone)}
		</a>
		<span class="block text-xs text-ink-faint">{when(lead.seenAt)}</span>
	</div>
{/snippet}

{#snippet shopCell(lead: Lead)}
	<div class="max-w-xs">
		<span class="block text-sm text-ink">{lead.shopName || '—'}</span>
		{#if lead.sells}
			<span class="block text-xs text-ink-muted">Sells {lead.sells}</span>
		{/if}
		{#if lead.sellsOn}
			<span class="block text-xs text-ink-faint">On {lead.sellsOn}</span>
		{/if}
		{#if lead.note}
			<span class="mt-1 line-clamp-2 block border-l-2 border-border pl-2 text-xs text-ink-muted">
				{lead.note}
			</span>
		{/if}
	</div>
{/snippet}

{#snippet statusCell(lead: Lead)}
	<Tag color={look[lead.status].color}>
		{#snippet icon()}
			{#if lead.status === 'qualified'}<Check size={13} />
			{:else if lead.status === 'lost'}<X size={13} />
			{:else if lead.status === 'contacted'}<Phone size={13} />
			{:else}<UserPlus size={13} />{/if}
		{/snippet}
		{look[lead.status].label}
	</Tag>
{/snippet}

{#snippet actionsCell(lead: Lead)}
	<div class="flex justify-end">
		<RowActions label="Actions for this lead">
			{#snippet menu({ close })}
				{#each statuses as s (s.value)}
					{#if s.value !== lead.status}
						<form method="POST" action="?/setStatus" use:enhance={() => () => close()}>
							<input type="hidden" name="id" value={lead.id} />
							<input type="hidden" name="status" value={s.value} />
							<MenuItem>
								<Phone size={15} />
								Mark as {s.label.toLowerCase()}
							</MenuItem>
						</form>
					{/if}
				{/each}
				<MenuItem
					onclick={() => {
						startNote(lead);
						close();
					}}
				>
					<StickyNote size={15} />
					{lead.note ? 'Edit the note' : 'Add a note'}
				</MenuItem>
				<form method="POST" action="?/remove" use:enhance>
					<input type="hidden" name="id" value={lead.id} />
					<MenuItem danger>
						<Trash2 size={15} />
						Delete
					</MenuItem>
				</form>
			{/snippet}
		</RowActions>
	</div>
{/snippet}

<svelte:head><title>Leads · Admin</title></svelte:head>

<PageHeader
	title="Leads"
	count={data.total}
	description="People who looked at the demo and left a number. Newest first, because a lead goes cold in a day."
>
	{#snippet actions()}
		{#if data.fresh}
			<Button variant="secondary" size="sm" onclick={() => setParams({ status: 'new' })}>
				<UserPlus size={15} />
				{data.fresh} to call
			</Button>
		{/if}
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
		bind:selection
		rowId={(lead) => lead.id}
		searchPlaceholder="Name, number, shop or what they sell"
		empty="Nobody has left their number yet."
	>
		{#snippet filters()}
			<Select
				value={data.filters.status}
				class="w-44"
				options={[{ value: '', label: 'All leads' }, ...statuses]}
				onchange={(v) => setParams({ status: v })}
			/>
		{/snippet}

		{#snippet bulk({ ids, clear })}
			<form method="POST" action="?/setStatus" use:enhance={() => () => clear()}>
				<input type="hidden" name="ids" value={ids.join(',')} />
				<input type="hidden" name="status" value="contacted" />
				<Button size="sm" variant="secondary">
					<Phone size={15} />
					Mark as called
				</Button>
			</form>
			<form method="POST" action="?/remove" use:enhance={() => () => clear()}>
				<input type="hidden" name="ids" value={ids.join(',')} />
				<Button size="sm" variant="secondary">
					<Trash2 size={15} />
					Delete
				</Button>
			</form>
		{/snippet}
	</DataTable>
</div>

<Dialog bind:open={dialogOpen} title="Note on this lead">
	{#if noting}
		<form
			method="POST"
			action="?/note"
			use:enhance={() => () => {
				dialogOpen = false;
			}}
			class="flex flex-col gap-4"
		>
			<input type="hidden" name="id" value={noting.id} />
			<p class="text-sm text-ink-muted">
				{noting.name} · <span class="num">{formatPhone(noting.phone)}</span>
			</p>
			<Textarea
				name="note"
				label="What happened"
				rows={5}
				bind:value={noteText}
				placeholder="Called on Tuesday. Runs a saree page, about 40 orders a month, wants to see the courier side."
			/>
			<div class="flex justify-end gap-2">
				<Button variant="secondary" type="button" onclick={() => (dialogOpen = false)}>
					Cancel
				</Button>
				<Button type="submit">Save the note</Button>
			</div>
		</form>
	{/if}
</Dialog>
