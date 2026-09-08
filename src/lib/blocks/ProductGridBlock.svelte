<script lang="ts">
	import type { CardProduct } from '$lib/shop/ProductCard.svelte';
	import type { BlockProps } from './schema';
	import { ArrowRight } from '@lucide/svelte';
	import ProductCard from '$lib/shop/ProductCard.svelte';

	/** Multi-row grid. Same card as the rows, just no horizontal limit. */
	let { props, products }: { props: BlockProps; products: CardProduct[] } = $props();

	const cols = $derived(
		Number(props.columns) === 4 ? 'sm:grid-cols-3 lg:grid-cols-4' : 'sm:grid-cols-3 lg:grid-cols-5'
	);
</script>

{#if products.length}
	<section class="mx-auto max-w-7xl px-4 py-8">
		<div class="mb-4 flex items-center justify-between gap-4">
			<h2 class="text-xl font-semibold tracking-tight text-ink">{props.heading}</h2>
			{#if props.href}
				<a
					href={props.href}
					class="flex shrink-0 items-center gap-1 text-sm text-ink-muted transition-colors hover:text-primary"
				>
					More products
					<ArrowRight size={15} />
				</a>
			{/if}
		</div>
		<div class="grid grid-cols-2 gap-4 {cols}">
			{#each products as p (p.id)}
				<ProductCard product={p} />
			{/each}
		</div>
	</section>
{/if}
