<script lang="ts">
	import ProductGrid from '$lib/shop/ProductGrid.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>{data.q ? `${data.q} · Search` : 'All products'} · {data.settings.store.name}</title>
</svelte:head>

<div class="mx-auto max-w-7xl px-4 py-6">
	<h1 class="text-2xl font-semibold tracking-tight text-ink">
		{#if data.q}
			Results for “{data.q}”
		{:else}
			All products
		{/if}
	</h1>

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
