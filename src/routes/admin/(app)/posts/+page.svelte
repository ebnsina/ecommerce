<script lang="ts">
	import { enhance } from '$app/forms';
	import { renderSnippet } from '@tanstack/svelte-table';
	import type { ColumnDef, RowSelectionState } from '@tanstack/svelte-table';
	import { Plus, Pencil, Trash2, Power, Newspaper, ExternalLink } from '@lucide/svelte';
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
	type Post = (typeof data)['rows'][number];

	let open = $state(false);
	let selection = $state<RowSelectionState>({});

	const when = (d: Date | string | null) =>
		d
			? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
			: '—';

	const columns: ColumnDef<any, Post>[] = [
		{ id: 'post', header: 'Post', cell: (c) => renderSnippet(postCell, c.row.original) },
		{ id: 'author', header: 'Author', cell: (c) => renderSnippet(authorCell, c.row.original) },
		{ id: 'state', header: 'Live', cell: (c) => renderSnippet(stateCell, c.row.original) },
		{ id: 'date', header: 'Published', cell: (c) => renderSnippet(dateCell, c.row.original) },
		{ id: 'actions', header: '', cell: (c) => renderSnippet(actionsCell, c.row.original) }
	];
</script>

{#snippet postCell(p: Post)}
	<a href="/admin/posts/{p.id}" class="flex items-center gap-3">
		<span
			class="grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-surface-alt"
		>
			{#if p.cover}
				<img src={p.cover} alt="" class="size-full object-cover" loading="lazy" />
			{:else}
				<Newspaper size={16} class="text-ink-faint" />
			{/if}
		</span>
		<span class="min-w-0">
			<span class="block truncate text-sm font-medium text-ink">{p.title}</span>
			<span class="block truncate text-xs text-ink-faint">/blog/{p.slug}</span>
		</span>
	</a>
{/snippet}

{#snippet authorCell(p: Post)}
	<span class="text-sm text-ink-muted">{p.author ?? '—'}</span>
{/snippet}

{#snippet stateCell(p: Post)}
	<span class="flex items-center gap-1.5 text-xs">
		<Power size={13} class={p.published ? 'text-ok-fg' : 'text-ink-faint'} />
		<span class="text-ink">{p.published ? 'Live' : 'Draft'}</span>
	</span>
{/snippet}

{#snippet dateCell(p: Post)}
	<span class="text-xs text-ink-muted">{when(p.publishedAt)}</span>
{/snippet}

{#snippet actionsCell(p: Post)}
	<div class="flex justify-end">
		<RowActions label="Actions for {p.title}">
			{#snippet menu()}
				<MenuItem href="/admin/posts/{p.id}">
					<Pencil size={15} />
					Edit
				</MenuItem>
				<MenuItem href="/demo/blog/{p.slug}">
					<ExternalLink size={15} />
					{p.published ? 'See it on the site' : 'Preview'}
				</MenuItem>
				<form method="POST" action="?/toggle" use:enhance>
					<input type="hidden" name="id" value={p.id} />
					<MenuItem>
						<Power size={15} />
						{p.published ? 'Unpublish' : 'Publish'}
					</MenuItem>
				</form>
				<form method="POST" action="?/remove" use:enhance>
					<input type="hidden" name="id" value={p.id} />
					<MenuItem danger>
						<Trash2 size={15} />
						Delete
					</MenuItem>
				</form>
			{/snippet}
		</RowActions>
	</div>
{/snippet}

<svelte:head><title>Blog · Admin</title></svelte:head>

<PageHeader
	title="Blog"
	count={data.total}
	description="Articles, buying guides and announcements. Drafts stay private until you publish them."
>
	{#snippet actions()}
		<Button size="sm" onclick={() => (open = true)}>
			<Plus size={15} />
			New post
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
		bind:selection
		rowId={(p) => p.id}
		searchPlaceholder="Post title or summary"
		empty="No posts yet."
	>
		{#snippet filters()}
			<Select
				value={data.filters.status}
				class="w-40"
				options={[
					{ value: '', label: 'All posts' },
					{ value: 'published', label: 'Live' },
					{ value: 'draft', label: 'Drafts' }
				]}
				onchange={(v) => setParams({ status: v })}
			/>
		{/snippet}

		{#snippet bulk({ ids, clear })}
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

<Dialog bind:open title="New post">
	<form id="post-form" method="POST" action="?/create" use:enhance class="flex flex-col gap-4">
		<Input
			label="Title"
			name="title"
			required
			placeholder="How to choose a rice cooker"
			hint="You can change this later. The web address follows it."
		/>
	</form>
	{#snippet footer()}
		<Button variant="secondary" onclick={() => (open = false)}>Cancel</Button>
		<Button type="submit" form="post-form">Create and write</Button>
	{/snippet}
</Dialog>
