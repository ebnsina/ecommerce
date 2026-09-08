<script lang="ts">
	/** Horizontal category row under the header — the first thing shoppers scan. */
	let { props, categories }: { props: Record<string, any>; categories: any[] } = $props();

	const items = $derived(categories.slice(0, Number(props.limit) || 12));
</script>

{#if items.length}
	<nav aria-label="Categories" class="mx-auto max-w-7xl px-4 pt-4">
		<ul
			class="flex [scrollbar-width:none] items-stretch gap-3 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden"
		>
			{#each items as cat (cat.id)}
				<li class="shrink-0">
					<a
						href="/c/{cat.slug}"
						class="flex h-full w-24 flex-col items-center gap-2 rounded-2xl border border-border
						       bg-surface px-2 py-3 text-center transition-colors duration-[180ms] ease-brand hover:border-brand-300"
					>
						<span class="size-12 overflow-hidden rounded-full bg-surface-alt">
							{#if cat.image}
								<img src={cat.image} alt="" class="size-full object-cover" loading="lazy" />
							{/if}
						</span>
						<span class="line-clamp-2 h-8 text-xs leading-tight font-medium text-ink"
							>{cat.name}</span
						>
					</a>
				</li>
			{/each}
		</ul>
	</nav>
{/if}
