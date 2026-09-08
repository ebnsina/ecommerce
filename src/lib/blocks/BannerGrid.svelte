<script lang="ts">
	import type { BlockItem, BlockProps } from './schema';
	import Img from '$lib/shop/Img.svelte';
	let { props }: { props: BlockProps } = $props();

	const banners = $derived((props.banners ?? []).filter((b: BlockItem) => b.image));
	/** '2+3' splits the row; the others are a single row. */
	const top = $derived(props.layout === '2+3' ? banners.slice(0, 2) : banners);
	const bottom = $derived(props.layout === '2+3' ? banners.slice(2, 5) : []);
	const cols = (n: number) => (n >= 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2');
	/* One ratio per row, so banners of different sizes still line up and no
	   image is stretched. Wider tiles get a wider crop. */
	const ratio = (n: number) => (n >= 3 ? 'aspect-[3/2]' : 'aspect-[2/1]');
</script>

{#if banners.length}
	<section class="mx-auto max-w-7xl px-4 py-4">
		<div class="flex flex-col gap-4">
			{#each [top, bottom] as row (row)}
				{#if row.length}
					<div class="grid gap-4 {cols(row.length)}">
						{#each row as b (b.image)}
							<a
								href={b.href || '#'}
								class="{ratio(row.length)} block overflow-hidden rounded-3xl bg-surface-alt"
							>
								<Img
									src={b.image}
									alt={b.alt ?? ''}
									width={960}
									height={640}
									sizes="(max-width: 640px) 100vw, 480px"
									class="size-full object-cover"
								/>
							</a>
						{/each}
					</div>
				{/if}
			{/each}
		</div>
	</section>
{/if}
