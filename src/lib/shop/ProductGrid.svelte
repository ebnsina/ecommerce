<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import ProductCard, { type CardProduct } from '$lib/shop/ProductCard.svelte';
	import Select from '$lib/ui/Select.svelte';
	import Button from '$lib/ui/Button.svelte';

	let {
		rows,
		total,
		pageNum,
		pages,
		sort
	}: {
		rows: CardProduct[];
		total: number;
		pageNum: number;
		pages: number;
		sort: string;
	} = $props();

	function go(patch: Record<string, string>) {
		// eslint-disable-next-line svelte/prefer-svelte-reactivity -- local to this function, never held as reactive state
		const params = new URLSearchParams(page.url.searchParams);
		for (const [k, v] of Object.entries(patch)) {
			if (v) params.set(k, v);
			else params.delete(k);
		}
		goto(`?${params}`, { noScroll: false });
	}
</script>

<div class="mb-4 flex flex-wrap items-center justify-between gap-3">
	<p class="text-sm text-ink-muted">
		<span class="num">{total}</span>
		{total === 1 ? 'product' : 'products'}
	</p>
	<Select
		value={sort}
		class="w-52"
		options={[
			{ value: 'newest', label: 'Newest first' },
			{ value: 'popular', label: 'Most popular' },
			{ value: 'price-asc', label: 'Price: low to high' },
			{ value: 'price-desc', label: 'Price: high to low' },
			{ value: 'rating', label: 'Highest rated' }
		]}
		onchange={(v) => go({ sort: v, page: '' })}
	/>
</div>

{#if rows.length}
	<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
		{#each rows as p (p.id)}
			<ProductCard product={p} />
		{/each}
	</div>

	{#if pages > 1}
		<div class="mt-8 flex items-center justify-center gap-3">
			<Button
				variant="secondary"
				size="sm"
				disabled={pageNum <= 1}
				onclick={() => go({ page: String(pageNum - 1) })}
			>
				Previous
			</Button>
			<span class="text-sm text-ink-muted">
				Page <span class="num">{pageNum}</span> of <span class="num">{pages}</span>
			</span>
			<Button
				variant="secondary"
				size="sm"
				disabled={pageNum >= pages}
				onclick={() => go({ page: String(pageNum + 1) })}
			>
				Next
			</Button>
		</div>
	{/if}
{:else}
	<p class="py-20 text-center text-ink-faint">Nothing here yet.</p>
{/if}
