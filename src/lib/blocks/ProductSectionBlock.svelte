<script lang="ts">
	import type { CardProduct } from '$lib/shop/ProductCard.svelte';
	import type { BlockProps } from './schema';
	import ProductSection from '$lib/shop/ProductSection.svelte';

	let { props, products }: { props: BlockProps; products: CardProduct[] } = $props();
</script>

<ProductSection
	title={props.heading}
	href={props.href}
	{products}
	columns={Number(props.columns) === 4 ? 4 : 5}
	size={props.cardSize === 'compact' ? 'compact' : 'standard'}
/>
