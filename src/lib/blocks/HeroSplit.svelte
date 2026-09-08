<script lang="ts">
	import Carousel from './Carousel.svelte';

	let { props }: { props: Record<string, any> } = $props();

	const slides = $derived((props.slides ?? []).filter((s: any) => s.image));
	const tiles = $derived((props.tiles ?? []).filter((t: any) => t.image).slice(0, 4));
	/* Tiles fill the same height as the slider. '1+1+2' = two full-width rows then
	   a split row, so the column is three rows tall, not four. */
	const tileGrid = $derived(
		props.layout === '2x2' ? 'grid-cols-2 lg:grid-rows-2' : 'grid-cols-2 lg:grid-rows-3'
	);
	const wide = (i: number) => props.layout !== '2x2' && i < 2;
</script>

{#if slides.length || tiles.length}
	<section class="mx-auto max-w-7xl px-4 py-6">
		<div class="grid gap-4 {tiles.length ? 'lg:grid-cols-[2fr_1fr]' : ''}">
			{#if slides.length}
				<div class="overflow-hidden rounded-3xl">
					<Carousel
						count={slides.length}
						interval={props.interval}
						ratio={props.aspect || '16 / 7'}
					>
						{#snippet slide(i)}
							<a href={slides[i].href || '#'} class="block size-full">
								<img
									src={slides[i].image}
									alt={slides[i].alt ?? ''}
									class="size-full object-cover"
								/>
							</a>
						{/snippet}
					</Carousel>
				</div>
			{/if}

			{#if tiles.length}
				<div class="grid gap-4 lg:h-full {tileGrid}">
					{#each tiles as tile, i (tile.image)}
						<!-- Absolute image so the tile has no intrinsic height: the row height
						     comes from the slider, and the tiles fill it instead of stretching it. -->
						<a
							href={tile.href || '#'}
							class="relative min-h-24 overflow-hidden rounded-3xl {wide(i) ? 'col-span-2' : ''}"
						>
							<img
								src={tile.image}
								alt={tile.alt ?? ''}
								class="absolute inset-0 size-full object-cover"
							/>
						</a>
					{/each}
				</div>
			{/if}
		</div>
	</section>
{/if}
