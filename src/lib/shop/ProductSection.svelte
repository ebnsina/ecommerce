<script lang="ts">
	import ProductCard, { type CardProduct } from '$lib/shop/ProductCard.svelte';
	import SectionHeader from './SectionHeader.svelte';
	import { reveal } from '$lib/reveal';
	import { sectionGrid } from '$lib/layouts';
	import { page } from '$app/state';

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

	// How many go across is the layout's call — see `sectionGrid`.
	const cols = $derived(sectionGrid(page.data.layout as string, Number(columns)));
</script>

{#if products.length}
	<section class="mx-auto max-w-7xl px-4 py-12 sm:py-14">
		<div use:reveal>
			<SectionHeader {title} {eyebrow} {subtitle} {href} linkLabel="See all" />
		</div>
		<div class="grid grid-cols-2 gap-4 sm:gap-5 {cols}">
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
