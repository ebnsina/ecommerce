<script lang="ts">
	import { Star } from '@lucide/svelte';

	/** rating is 0–50 (45 = 4.5 stars) so it stays an integer in the DB. */
	let { rating, count, size = 13 }: { rating: number; count?: number; size?: number } = $props();

	const stars = $derived(Math.round(rating / 10));
</script>

<span class="flex items-center gap-1" aria-label="Rated {(rating / 10).toFixed(1)} out of 5">
	<span class="flex" aria-hidden="true">
		{#each [1, 2, 3, 4, 5] as i (i)}
			<Star {size} class={i <= stars ? 'fill-star text-star' : 'fill-border text-border'} />
		{/each}
	</span>
	{#if count !== undefined}
		<span class="num text-xs text-ink-faint">({count})</span>
	{/if}
</span>
