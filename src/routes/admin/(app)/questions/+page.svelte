<script lang="ts">
	import type { AdminTableFeatures } from '$lib/admin/table';
	import { enhance } from '$app/forms';
	import { renderSnippet } from '@tanstack/svelte-table';
	import type { ColumnDef, RowSelectionState } from '@tanstack/svelte-table';
	import { MessageCircleQuestion, Trash2, ExternalLink, Send, Check } from '@lucide/svelte';
	import Select from '$lib/ui/Select.svelte';
	import Button from '$lib/ui/Button.svelte';
	import Textarea from '$lib/ui/Textarea.svelte';
	import Dialog from '$lib/ui/Dialog.svelte';
	import DataTable from '$lib/admin/DataTable.svelte';
	import PageHeader from '$lib/admin/PageHeader.svelte';
	import RowActions from '$lib/admin/RowActions.svelte';
	import MenuItem from '$lib/admin/MenuItem.svelte';
	import { setParams } from '$lib/admin/listQuery';

	let { data, form } = $props();
	type Question = (typeof data)['rows'][number];

	let selection = $state<RowSelectionState>({});
	let answering = $state<Question | null>(null);
	/* Bound to the dialog: closing it with Escape or the X must also clear the
	   question being answered, or reopening shows the old one. */
	let dialogOpen = $state(false);
	$effect(() => {
		if (!dialogOpen) answering = null;
	});
	let answerText = $state('');

	const when = (d: Date | string) =>
		new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

	function startAnswer(qn: Question) {
		answering = qn;
		answerText = qn.answer ?? '';
		dialogOpen = true;
	}

	const columns: ColumnDef<AdminTableFeatures, Question>[] = [
		{
			id: 'question',
			header: 'Question',
			cell: (c) => renderSnippet(questionCell, c.row.original)
		},
		{ id: 'product', header: 'Product', cell: (c) => renderSnippet(productCell, c.row.original) },
		{ id: 'state', header: 'Answered', cell: (c) => renderSnippet(stateCell, c.row.original) },
		{ id: 'actions', header: '', cell: (c) => renderSnippet(actionsCell, c.row.original) }
	];
</script>

{#snippet questionCell(qn: Question)}
	<div class="max-w-md">
		<span class="block text-sm text-ink">{qn.question}</span>
		<span class="block text-xs text-ink-faint">{qn.authorName} · {when(qn.createdAt)}</span>
		{#if qn.answer}
			<span class="mt-1 line-clamp-2 block border-l-2 border-border pl-2 text-xs text-ink-muted">
				{qn.answer}
			</span>
		{/if}
	</div>
{/snippet}

{#snippet productCell(qn: Question)}
	<a href="/demo/p/{qn.productSlug}" class="text-sm text-primary hover:underline"
		>{qn.productTitle}</a
	>
{/snippet}

{#snippet stateCell(qn: Question)}
	<span class="flex items-center gap-1.5 text-xs">
		{#if qn.answer}
			<Check size={14} class="text-ok-fg" />
			<span class="text-ink">Answered</span>
		{:else}
			<MessageCircleQuestion size={14} class="text-warn-fg" />
			<span class="text-ink">Waiting</span>
		{/if}
	</span>
{/snippet}

{#snippet actionsCell(qn: Question)}
	<div class="flex justify-end">
		<RowActions label="Actions for this question">
			{#snippet menu({ close })}
				<MenuItem
					onclick={() => {
						startAnswer(qn);
						close();
					}}
				>
					<Send size={15} />
					{qn.answer ? 'Edit the answer' : 'Answer'}
				</MenuItem>
				<MenuItem href="/demo/p/{qn.productSlug}">
					<ExternalLink size={15} />
					See the product
				</MenuItem>
				<form method="POST" action="?/remove" use:enhance>
					<input type="hidden" name="id" value={qn.id} />
					<MenuItem danger>
						<Trash2 size={15} />
						Delete
					</MenuItem>
				</form>
			{/snippet}
		</RowActions>
	</div>
{/snippet}

<svelte:head><title>Questions · Admin</title></svelte:head>

<PageHeader
	title="Questions"
	count={data.total}
	description="A question stays private until you answer it. Then both appear on the product."
>
	{#snippet actions()}
		{#if data.unanswered}
			<Button variant="secondary" size="sm" onclick={() => setParams({ status: 'unanswered' })}>
				<MessageCircleQuestion size={15} />
				{data.unanswered} waiting
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
		rowId={(qn) => qn.id}
		searchPlaceholder="Asker, product or wording"
		empty="No questions match this view."
	>
		{#snippet filters()}
			<Select
				value={data.filters.status}
				class="w-44"
				options={[
					{ value: '', label: 'All questions' },
					{ value: 'unanswered', label: 'Waiting' },
					{ value: 'answered', label: 'Answered' }
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

<Dialog bind:open={dialogOpen} title="Answer this question">
	{#if answering}
		<form
			method="POST"
			action="?/answer"
			use:enhance={() =>
				({ update }) => {
					dialogOpen = false;
					return update();
				}}
			class="flex flex-col gap-4"
		>
			<input type="hidden" name="id" value={answering.id} />
			<p class="rounded-2xl bg-surface-alt p-4 text-sm text-ink">{answering.question}</p>
			<Textarea
				label="Your answer"
				name="answer"
				bind:value={answerText}
				rows={4}
				hint="This is published on the product page next to the question."
			/>
			<div class="flex justify-end gap-2">
				<Button type="button" variant="secondary" onclick={() => (dialogOpen = false)}
					>Cancel</Button
				>
				<Button type="submit">
					<Send size={15} />
					Publish the answer
				</Button>
			</div>
		</form>
	{/if}
</Dialog>
