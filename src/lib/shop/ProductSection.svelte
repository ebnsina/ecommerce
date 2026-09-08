<script lang="ts">
	import ProductCard, { type CardProduct } from '$lib/shop/ProductCard.svelte';
	import SectionHeader from './SectionHeader.svelte';
	import { reveal } from '$lib/reveal';

	let {
		title,
		eyebrow,
		subtitle,
		href,
		products,
		columns = 5,
		size = 'standard'
	}: {
		title: string;
		eyebrow?: string;
		subtitle?: string;
		href?: string;
		products: CardProduct[];
		columns?: 4 | 5;
		size?: 'standard' | 'compact';
	} = $props();

	const cols = { 4: 'sm:grid-cols-3 lg:grid-cols-4', 5: 'sm:grid-cols-3 lg:grid-cols-5' };
</script>

{#if products.length}
	<section class="mx-auto max-w-7xl px-4 py-12 sm:py-14">
		<div use:reveal>
			<SectionHeader {title} {eyebrow} {subtitle} {href} linkLabel="See all" />
		</div>
		<div class="grid grid-cols-2 gap-4 sm:gap-5 {cols[columns]}">
			{#each products as p, i (p.id)}
				<!-- Staggered by column, capped: a row that takes a second to arrive
				     reads as slow, not considered. -->
				<div use:reveal={{ delay: Math.min(i, 4) * 60 }}>
					<ProductCard product={p} {size} />
				</div>
			{/each}
		</div>
	</section>
{/if}
