<script lang="ts">
	import type { CardProduct } from '$lib/shop/ProductCard.svelte';
	import type { BlockProps } from './schema';
	import { ArrowRight } from '@lucide/svelte';
	import ProductCard from '$lib/shop/ProductCard.svelte';
	import Countdown from './Countdown.svelte';

	let { props, products }: { props: BlockProps; products: CardProduct[] } = $props();

	const feature = $derived(products.slice(0, 2));
	const rest = $derived(products.slice(2));
</script>

{#if products.length}
	<section class="mx-auto max-w-7xl px-4 py-8">
		<div class="mb-4 flex flex-wrap items-center justify-between gap-3">
			<div class="flex flex-wrap items-center gap-4">
				<h2 class="text-xl font-semibold tracking-tight text-sale">{props.heading}</h2>
				{#if props.countdownTo}<Countdown to={props.countdownTo} />{/if}
			</div>
			{#if props.href}
				<a
					href={props.href}
					class="flex items-center gap-1 text-sm text-ink-muted transition-colors hover:text-primary"
				>
					More products
					<ArrowRight size={15} />
				</a>
			{/if}
		</div>

		{#if feature.length}
			<div class="grid gap-4 lg:grid-cols-2">
				{#each feature as p (p.id)}
					<ProductCard product={p} size="feature" />
				{/each}
			</div>
		{/if}

		{#if rest.length}
			<div class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
				{#each rest as p (p.id)}
					<ProductCard product={p} size="compact" />
				{/each}
			</div>
		{/if}
	</section>
{/if}
