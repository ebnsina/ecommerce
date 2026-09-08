<script lang="ts">
	/** Horizontal category row under the header — the first thing shoppers scan. */
	let { props, categories }: { props: Record<string, any>; categories: any[] } = $props();

	const items = $derived(categories.slice(0, Number(props.limit) || 8));
</script>

{#if items.length}
	<nav aria-label="Categories" class="mx-auto max-w-7xl px-4 pt-4">
		<!-- A grid, not a scroller: the whole set fits one row on a phone at four
		     across and on a desktop at eight, so nothing is hidden off-screen. -->
		<ul class="grid grid-cols-4 gap-3 sm:grid-cols-6 lg:grid-cols-8">
			{#each items as cat (cat.id)}
				<li>
					<a
						href="/c/{cat.slug}"
						class="flex h-full flex-col items-center gap-2 rounded-2xl border border-border
						       bg-surface px-2 py-3 text-center transition-colors duration-[180ms] ease-brand hover:border-brand-300"
					>
						<span class="size-12 shrink-0 overflow-hidden rounded-full bg-surface-alt">
							{#if cat.image}
								<img src={cat.image} alt="" class="size-full object-cover" loading="lazy" />
							{/if}
						</span>
						<span
							class="truncate text-[11px] leading-tight font-semibold tracking-wide text-ink uppercase"
							title={cat.name}>{cat.name}</span
						>
					</a>
				</li>
			{/each}
		</ul>
	</nav>
{/if}
