<script lang="ts">
	import type { CardProduct } from '$lib/shop/ProductCard.svelte';
	import type { Brand } from './Brands.svelte';
	import type { BlockCategory, BlockProps } from './schema';
	import CategoryStrip from './CategoryStrip.svelte';
	import HeroSplit from './HeroSplit.svelte';
	import PolicyStrip from './PolicyStrip.svelte';
	import Banner from './Banner.svelte';
	import BannerGrid from './BannerGrid.svelte';
	import HotDeals from './HotDeals.svelte';
	import ProductSectionBlock from './ProductSectionBlock.svelte';
	import ProductGridBlock from './ProductGridBlock.svelte';
	import Brands from './Brands.svelte';
	import CategoryTiles from './CategoryTiles.svelte';
	import RichText from './RichText.svelte';
	import ContactBand from './ContactBand.svelte';

	/** type -> component. Adding a block means one entry here and one in schema.ts. */
	const registry: BlockProps = {
		categoryStrip: CategoryStrip,
		heroSplit: HeroSplit,
		policyStrip: PolicyStrip,
		banner: Banner,
		bannerGrid: BannerGrid,
		hotDeals: HotDeals,
		productSection: ProductSectionBlock,
		productGrid: ProductGridBlock,
		brands: Brands,
		categoryTiles: CategoryTiles,
		richText: RichText,
		contactBand: ContactBand
	};

	type Rendered = {
		id: string;
		type: string;
		props: BlockProps;
		products?: CardProduct[];
		brands?: Brand[];
	};

	let { blocks, categories = [] }: { blocks: Rendered[]; categories?: BlockCategory[] } = $props();
</script>

{#each blocks as block (block.id)}
	{@const Component = registry[block.type]}
	{#if Component}
		<Component
			props={block.props}
			products={block.products ?? []}
			brands={block.brands ?? []}
			{categories}
		/>
	{/if}
{/each}
