<script lang="ts">
	import { enhance } from '$app/forms';
	import { fade } from 'svelte/transition';
	import { HeartOff, Heart } from '@lucide/svelte';
	import { fadeIn } from '$lib/motion';
	import ProductCard from '$lib/shop/ProductCard.svelte';
	import Button from '$lib/ui/Button.svelte';

	let { data } = $props();
</script>

<svelte:head><title>Wishlist · {data.settings.store.name}</title></svelte:head>

<h1 class="text-2xl font-semibold tracking-tight text-ink">Wishlist</h1>

{#if data.items.length}
	<div class="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
		{#each data.items as p (p.id)}
			<div class="relative" transition:fade={fadeIn()}>
				<ProductCard product={p} />
				<form method="POST" action="?/wishlist" use:enhance class="absolute top-4 right-4">
					<input type="hidden" name="productId" value={p.id} />
					<input type="hidden" name="redirectTo" value="/account/wishlist" />
					<button
						class="grid size-8 place-items-center rounded-lg bg-surface/80 text-sale backdrop-blur-sm transition-colors"
						aria-label="Remove {p.title} from wishlist"
					>
						<Heart size={16} class="fill-sale" />
					</button>
				</form>
			</div>
		{/each}
	</div>
{:else}
	<div class="mt-6 flex flex-col items-center gap-4 rounded-3xl border border-border px-6 py-20">
		<HeartOff size={26} class="text-ink-faint" />
		<p class="text-sm text-ink-muted">Nothing saved yet.</p>
		<Button href="/search">Browse products</Button>
	</div>
{/if}
