<script lang="ts">
	let { props, categories }: { props: Record<string, any>; categories: any[] } = $props();

	const tiles = $derived(categories.slice(0, Number(props.limit) || 6));
</script>

{#if tiles.length}
	<section class="mx-auto max-w-7xl px-4 py-8">
		{#if props.heading}
			<h2 class="mb-4 text-xl font-semibold tracking-tight text-ink">{props.heading}</h2>
		{/if}
		<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
			{#each tiles as cat (cat.id)}
				<a
					href="/c/{cat.slug}"
					class="flex flex-col items-center gap-3 rounded-3xl border border-border bg-surface p-4 text-center transition-colors hover:border-brand-300"
				>
					<span class="size-16 overflow-hidden rounded-2xl bg-surface-alt">
						{#if cat.image}<img src={cat.image} alt="" class="size-full object-cover" />{/if}
					</span>
					<span class="text-sm font-medium text-ink">{cat.name}</span>
				</a>
			{/each}
		</div>
	</section>
{/if}
