<script lang="ts">
	import { ChevronRight } from '@lucide/svelte';
	import ProductGrid from '$lib/shop/ProductGrid.svelte';

	let { data } = $props();
</script>

<svelte:head><title>{data.category.name} · {data.settings.store.name}</title></svelte:head>

<div class="mx-auto max-w-7xl px-4 py-6">
	<nav aria-label="Breadcrumb" class="flex items-center gap-1 text-xs text-ink-muted">
		<a href="/" class="hover:text-ink">Home</a>
		<ChevronRight size={13} class="text-ink-faint" />
		<span class="font-medium text-ink">{data.category.name}</span>
	</nav>

	<h1 class="mt-3 text-2xl font-semibold tracking-tight text-ink">
		{data.category.name}
		{#if data.category.nameBn}
			<span class="font-normal text-ink-muted"> · {data.category.nameBn}</span>
		{/if}
	</h1>

	{#if data.children.length}
		<div class="mt-4 flex flex-wrap gap-2">
			{#each data.children as c (c.id)}
				<a
					href="/c/{c.slug}"
					class="rounded-xl border border-border px-3 py-1.5 text-sm text-ink-muted transition-colors hover:border-brand-300 hover:text-primary"
				>
					{c.name}
				</a>
			{/each}
		</div>
	{/if}

	<div class="mt-6">
		<ProductGrid
			rows={data.rows}
			total={data.total}
			pageNum={data.page}
			pages={data.pages}
			sort={data.sort}
		/>
	</div>
</div>
