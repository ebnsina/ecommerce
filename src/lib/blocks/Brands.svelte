<script lang="ts">
	import Rating from '$lib/shop/Rating.svelte';

	type Brand = { brand: string; count: number; rating: number; images: string[] };

	let { props, brands = [] }: { props: Record<string, any>; brands?: Brand[] } = $props();
</script>

{#if brands.length}
	<section class="mx-auto max-w-7xl px-4 py-8">
		<h2 class="mb-4 text-xl font-semibold tracking-tight text-ink">{props.heading}</h2>
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
			{#each brands as b (b.brand)}
				<a
					href="/demo/search?q={encodeURIComponent(b.brand)}"
					class="flex flex-col gap-3 rounded-3xl border border-border bg-surface p-4 transition-colors duration-[180ms] ease-brand hover:border-brand-300"
				>
					<div>
						<p class="text-sm font-medium text-ink">
							{b.brand}
							<span class="num font-normal text-ink-muted"
								>({b.count} {b.count === 1 ? 'product' : 'products'})</span
							>
						</p>
						<Rating rating={b.rating} size={12} />
					</div>
					<div class="grid grid-cols-3 gap-2">
						{#each b.images as img (img)}
							<span class="aspect-square overflow-hidden rounded-xl bg-surface-alt">
								<img src={img} alt="" class="size-full object-cover" loading="lazy" />
							</span>
						{/each}
					</div>
				</a>
			{/each}
		</div>
	</section>
{/if}
