<script lang="ts">
	import ProductSection from '$lib/shop/ProductSection.svelte';

	let { props, products }: { props: Record<string, any>; products: any[] } = $props();
</script>

<ProductSection
	title={props.heading}
	href={props.href}
	{products}
	columns={Number(props.columns) === 4 ? 4 : 5}
	size={props.cardSize === 'compact' ? 'compact' : 'standard'}
/>
