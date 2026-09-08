<script lang="ts">
	import { enhance } from '$app/forms';
	import { RefreshCw, Search, Check, TriangleAlert, PackageX, Zap } from '@lucide/svelte';
	import Button from '$lib/ui/Button.svelte';
	import PageHeader from '$lib/admin/PageHeader.svelte';

	let { data, form } = $props();
	let reindexing = $state(false);
</script>

<svelte:head><title>Search · Admin</title></svelte:head>

<PageHeader title="Search" description="How shoppers find things, and what they could not find.">
	{#snippet actions()}
		<form
			method="POST"
			action="?/reindex"
			use:enhance={() => {
				reindexing = true;
				return async ({ update }) => {
					reindexing = false;
					await update();
				};
			}}
		>
			<Button type="submit" size="sm" variant="secondary" disabled={reindexing || !data.configured}>
				<RefreshCw size={15} class={reindexing ? 'animate-spin' : ''} />
				{reindexing ? 'Rebuilding…' : 'Rebuild the index'}
			</Button>
		</form>
	{/snippet}
</PageHeader>

<div class="mt-6 rounded-3xl border border-border bg-surface p-5">
	<h2 class="flex items-center gap-2 text-sm font-medium text-ink">
		{#if data.configured}
			<Zap size={16} class="text-ok-fg" />
			Fast search is on
		{:else}
			<Search size={16} class="text-ink-faint" />
			Using the database
		{/if}
	</h2>
	<p class="mt-1 text-sm text-ink-muted">
		{#if data.configured}
			Searches go through Typesense, which forgives spelling — "kettel" still finds the kettle — and
			orders results by how well they match. Rebuild the index after a bulk import; single edits
			keep themselves in step.
		{:else}
			The shop is searching the database directly. That works, but it matches only what is typed
			exactly: a shopper who writes "washing mashine" gets nothing. Connecting Typesense fixes that
			— the settings it needs are on the Connections page.
		{/if}
	</p>
	<p class="num mt-3 text-xs text-ink-faint">{data.active} products searchable</p>

	{#if form?.error}
		<p class="mt-4 flex items-center gap-2 text-sm text-sale" role="alert">
			<TriangleAlert size={15} />
			{form.error}
		</p>
	{:else if form?.indexed !== undefined}
		<p class="mt-4 flex items-center gap-2 text-sm text-ink">
			<Check size={15} class="text-ok-fg" />
			<span class="num">{form.indexed}</span> products indexed.
		</p>
	{/if}
</div>

<div class="mt-4 grid gap-4 lg:grid-cols-2">
	<section class="rounded-3xl border border-border bg-surface p-5">
		<h2 class="flex items-center gap-2 text-sm font-medium text-ink">
			<Search size={16} class="text-primary" />
			Most searched, last 30 days
		</h2>
		<ul class="mt-4 flex flex-col">
			{#each data.searches as row (row.term)}
				<li
					class="flex items-center justify-between gap-3 border-b border-border py-2 last:border-0"
				>
					<a href="/search?q={encodeURIComponent(row.term)}" class="truncate text-sm text-ink">
						{row.term}
					</a>
					<span class="num text-sm text-ink-muted">{row.searches}</span>
				</li>
			{:else}
				<li class="py-8 text-center text-sm text-ink-faint">No searches recorded yet.</li>
			{/each}
		</ul>
	</section>

	<section class="rounded-3xl border border-border bg-surface p-5">
		<h2 class="flex items-center gap-2 text-sm font-medium text-ink">
			<PackageX size={16} class="text-sale" />
			Found nothing
		</h2>
		<p class="mt-1 text-xs text-ink-muted">
			Either you do not stock it, or it is named something the shopper would not type.
		</p>
		<ul class="mt-4 flex flex-col">
			{#each data.unmet as row (row.term)}
				<li
					class="flex items-center justify-between gap-3 border-b border-border py-2 last:border-0"
				>
					<a href="/search?q={encodeURIComponent(row.term)}" class="truncate text-sm text-ink">
						{row.term}
					</a>
					<span class="num text-sm text-ink-muted">{row.searches}</span>
				</li>
			{:else}
				<li class="py-8 text-center text-sm text-ink-faint">
					Every search so far found something.
				</li>
			{/each}
		</ul>
	</section>
</div>
