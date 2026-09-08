<script lang="ts">
	import { SlidersHorizontal } from '@lucide/svelte';
	import ProductGrid from '$lib/shop/ProductGrid.svelte';
	import SearchFilters from '$lib/shop/SearchFilters.svelte';
	import Dialog from '$lib/ui/Dialog.svelte';

	let { data } = $props();

	/* The panel is a sidebar on a desktop and a dialog on a phone — where most
	   of these shoppers are, and where a permanent sidebar would eat the grid. */
	let filtersOpen = $state(false);
</script>

<svelte:head>
	<title>{data.q ? `${data.q} · Search` : 'All products'} · {data.settings.store.name}</title>
</svelte:head>

<div class="mx-auto max-w-7xl px-4 py-6">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<h1 class="text-2xl font-semibold tracking-tight text-ink">
			{#if data.q}
				Results for “{data.q}”
			{:else}
				All products
			{/if}
		</h1>

		<button
			class="flex h-11 items-center gap-2 rounded-xl border border-border px-3.5 text-sm font-medium
			       text-ink transition-colors duration-[180ms] ease-brand hover:border-brand-300 lg:hidden"
			onclick={() => (filtersOpen = true)}
		>
			<SlidersHorizontal size={16} />
			Filters
		</button>
	</div>

	<div class="mt-6 grid gap-8 lg:grid-cols-[16rem_1fr]">
		<aside class="hidden lg:block">
			<SearchFilters facets={data.facets} filters={data.filters} />
		</aside>

		<div class="min-w-0">
			<ProductGrid
				rows={data.rows}
				total={data.total}
				pageNum={data.page}
				pages={data.pages}
				sort={data.sort}
			/>
		</div>
	</div>
</div>

<Dialog bind:open={filtersOpen} title="Filters">
	<SearchFilters facets={data.facets} filters={data.filters} />
	{#snippet footer()}
		<button
			class="h-11 w-full rounded-xl bg-primary px-4 text-sm font-medium text-white transition-colors
			       duration-[180ms] ease-brand hover:bg-primary-hover"
			onclick={() => (filtersOpen = false)}
		>
			Show <span class="num">{data.total}</span> products
		</button>
	{/snippet}
</Dialog>
