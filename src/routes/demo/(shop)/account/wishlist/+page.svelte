<script lang="ts">
	import { fade } from 'svelte/transition';
	import { HeartOff } from '@lucide/svelte';
	import { page } from '$app/state';
	import { cardColumns } from '$lib/layouts';
	import { fadeIn } from '$lib/motion';
	import ProductCard from '$lib/shop/ProductCard.svelte';
	import Button from '$lib/ui/Button.svelte';

	let { data } = $props();
</script>

<svelte:head><title>Wishlist · {data.settings.store.name}</title></svelte:head>

<h1 class="text-2xl font-semibold tracking-tight text-ink">Wishlist</h1>

{#if data.items.length}
	<div class="mt-6 grid gap-4" style={cardColumns(page.data.layout as string)}>
		{#each data.items as p (p.id)}
			<!-- The card's own heart is the remove button here: it posts to the same
			     action with this page as its return path, and putting a second one
			     on top of it left two controls stacked in the same corner, the
			     lower one unclickable. -->
			<div transition:fade={fadeIn()}>
				<ProductCard product={p} />
			</div>
		{/each}
	</div>
{:else}
	<div class="mt-6 flex flex-col items-center gap-4 rounded-3xl border border-border px-6 py-20">
		<HeartOff size={26} class="text-ink-faint" />
		<p class="text-sm text-ink-muted">Nothing saved yet.</p>
		<Button href="/demo/search">Browse products</Button>
	</div>
{/if}
