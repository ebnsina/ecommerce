<script lang="ts">
	import type { BlockCategory, BlockProps } from './schema';
	import Img from '$lib/shop/Img.svelte';
	/** Horizontal category row under the header — the first thing shoppers scan. */
	let { props, categories }: { props: BlockProps; categories: BlockCategory[] } = $props();

	const items = $derived(categories.slice(0, Number(props.limit) || 8));
</script>

{#if items.length}
	<nav aria-label="Categories" class="mx-auto max-w-7xl px-4 pt-4">
		<!-- A grid, not a scroller: the whole set is on screen rather than half of
		     it hidden off the right. As many as fit rather than always eight —
		     eight in a narrowed column crushes every name to two syllables. -->
		<ul
			class="grid gap-3"
			style="grid-template-columns:repeat(auto-fit,minmax(min(6.5rem,100%),1fr))"
		>
			{#each items as cat (cat.id)}
				<li>
					<a
						href="/demo/c/{cat.slug}"
						class="flex h-full flex-col items-center gap-2 rounded-2xl border border-border
						       bg-surface px-2 py-3 text-center transition-colors duration-[180ms] ease-brand hover:border-brand-300"
					>
						<span class="size-12 shrink-0 overflow-hidden rounded-full bg-surface-alt">
							{#if cat.image}
								<Img
									src={cat.image}
									width={96}
									height={96}
									sizes="48px"
									class="size-full object-cover"
								/>
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
