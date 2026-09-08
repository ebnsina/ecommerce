<script lang="ts">
	import type { Snippet } from 'svelte';
	import { fade } from 'svelte/transition';
	import { ChevronLeft, ChevronRight } from '@lucide/svelte';
	import { DUR_SLOW, reduced } from '$lib/motion';

	/**
	 * Slide shell shared by heroSplit and banner.
	 *
	 * The box holds a fixed aspect ratio and slides sit absolutely inside it, so
	 * images of any size fill the same frame: no height jump between slides, and
	 * no layout shift while the crossfade has both slides mounted.
	 */
	let {
		count,
		interval = 6,
		ratio = '16 / 7',
		slide
	}: { count: number; interval?: number; ratio?: string; slide: Snippet<[number]> } = $props();

	let index = $state(0);
	let paused = $state(false);

	$effect(() => {
		if (count < 2 || paused || reduced()) return;
		const t = setInterval(() => (index = (index + 1) % count), Math.max(2, interval) * 1000);
		return () => clearInterval(t);
	});

	const go = (n: number) => (index = (n + count) % count);
</script>

<div
	class="relative w-full overflow-hidden"
	style="aspect-ratio: {ratio}"
	role="region"
	aria-roledescription="carousel"
	aria-label="Promotional banners"
	onpointerenter={() => (paused = true)}
	onpointerleave={() => (paused = false)}
>
	{#key index}
		<div class="absolute inset-0" in:fade={{ duration: reduced() ? 0 : DUR_SLOW }}>
			{@render slide(index)}
		</div>
	{/key}

	{#if count > 1}
		<button
			class="absolute top-1/2 left-3 z-10 grid size-9 -translate-y-1/2 place-items-center rounded-xl bg-surface/80 text-ink backdrop-blur-sm transition-colors hover:bg-surface"
			aria-label="Previous slide"
			onclick={() => go(index - 1)}
		>
			<ChevronLeft size={17} />
		</button>
		<button
			class="absolute top-1/2 right-3 z-10 grid size-9 -translate-y-1/2 place-items-center rounded-xl bg-surface/80 text-ink backdrop-blur-sm transition-colors hover:bg-surface"
			aria-label="Next slide"
			onclick={() => go(index + 1)}
		>
			<ChevronRight size={17} />
		</button>

		<div class="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
			{#each { length: count } as _, i (i)}
				<button
					class="h-1.5 rounded-full transition-all duration-[180ms] ease-brand
					       {i === index ? 'w-5 bg-primary' : 'w-1.5 bg-surface/70 hover:bg-surface'}"
					aria-label="Go to slide {i + 1}"
					aria-current={i === index}
					onclick={() => (index = i)}
				></button>
			{/each}
		</div>
	{/if}
</div>
