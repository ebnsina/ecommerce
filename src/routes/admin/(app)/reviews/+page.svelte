<script lang="ts">
	import { enhance } from '$app/forms';
	import { renderSnippet } from '@tanstack/svelte-table';
	import type { ColumnDef, RowSelectionState } from '@tanstack/svelte-table';
	import { Check, EyeOff, Trash2, ExternalLink, Star } from '@lucide/svelte';
	import Select from '$lib/ui/Select.svelte';
	import Button from '$lib/ui/Button.svelte';
	import DataTable from '$lib/admin/DataTable.svelte';
	import PageHeader from '$lib/admin/PageHeader.svelte';
	import RowActions from '$lib/admin/RowActions.svelte';
	import MenuItem from '$lib/admin/MenuItem.svelte';
	import { setParams } from '$lib/admin/listQuery';

	let { data } = $props();
	type Review = (typeof data)['rows'][number];

	let selection = $state<RowSelectionState>({});

	const when = (d: Date | string) =>
		new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

	const columns: ColumnDef<any, Review>[] = [
		{ id: 'review', header: 'Review', cell: (c) => renderSnippet(reviewCell, c.row.original) },
		{ id: 'product', header: 'Product', cell: (c) => renderSnippet(productCell, c.row.original) },
		{ id: 'rating', header: 'Rating', cell: (c) => renderSnippet(ratingCell, c.row.original) },
		{ id: 'state', header: 'Shown', cell: (c) => renderSnippet(stateCell, c.row.original) },
		{ id: 'actions', header: '', cell: (c) => renderSnippet(actionsCell, c.row.original) }
	];
</script>

{#snippet reviewCell(r: Review)}
	<div class="max-w-md">
		<span class="block text-sm font-medium text-ink">{r.title || r.authorName}</span>
		{#if r.body}
			<span class="line-clamp-2 block text-xs text-ink-muted">{r.body}</span>
		{/if}
		<span class="block text-xs text-ink-faint">{r.authorName} · {when(r.createdAt)}</span>
	</div>
{/snippet}

{#snippet productCell(r: Review)}
	<a href="/p/{r.productSlug}" class="text-sm text-primary hover:underline">{r.productTitle}</a>
{/snippet}

{#snippet ratingCell(r: Review)}
	<span class="flex items-center gap-1">
		<Star size={14} class="fill-warn-fg text-warn-fg" />
		<span class="num text-sm text-ink">{r.rating}</span>
	</span>
{/snippet}

{#snippet stateCell(r: Review)}
	<!-- A word, not just a colour: the state has to survive a greyscale print. -->
	<span class="flex items-center gap-1.5 text-xs">
		{#if r.approved}
			<Check size={14} class="text-ok-fg" />
			<span class="text-ink">Published</span>
		{:else}
			<EyeOff size={14} class="text-warn-fg" />
			<span class="text-ink">Waiting</span>
		{/if}
	</span>
{/snippet}

{#snippet actionsCell(r: Review)}
	<div class="flex justify-end">
		<RowActions label="Actions for {r.authorName}’s review">
			{#snippet menu()}
				<form method="POST" action={r.approved ? '?/unapprove' : '?/approve'} use:enhance>
					<input type="hidden" name="id" value={r.id} />
					<MenuItem>
						{#if r.approved}<EyeOff size={15} />Hide from the shop{:else}<Check
								size={15}
							/>Publish{/if}
					</MenuItem>
				</form>
				<MenuItem href="/p/{r.productSlug}">
					<ExternalLink size={15} />
					See the product
				</MenuItem>
				<form method="POST" action="?/remove" use:enhance>
					<input type="hidden" name="id" value={r.id} />
					<MenuItem danger>
						<Trash2 size={15} />
						Delete
					</MenuItem>
				</form>
			{/snippet}
		</RowActions>
	</div>
{/snippet}

<svelte:head><title>Reviews · Admin</title></svelte:head>

<PageHeader
	title="Reviews"
	count={data.total}
	description="Reviews stay hidden from the shop until you publish them."
>
	{#snippet actions()}
		{#if data.pending}
			<Button variant="secondary" size="sm" onclick={() => setParams({ status: 'pending' })}>
				<EyeOff size={15} />
				{data.pending} waiting
			</Button>
		{/if}
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
		bind:selection
		rowId={(r) => r.id}
		searchPlaceholder="Reviewer, product or wording"
		empty="No reviews match this view."
	>
		{#snippet filters()}
			<Select
				value={data.filters.status}
				class="w-44"
				options={[
					{ value: '', label: 'All reviews' },
					{ value: 'pending', label: 'Waiting' },
					{ value: 'approved', label: 'Published' }
				]}
				onchange={(v) => setParams({ status: v })}
			/>
		{/snippet}

		{#snippet bulk({ ids, clear })}
			<form method="POST" action="?/approve" use:enhance={() => () => clear()}>
				<input type="hidden" name="ids" value={ids.join(',')} />
				<Button size="sm" variant="secondary">
					<Check size={15} />
					Publish
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
