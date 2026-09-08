<script lang="ts">
	import { ChevronRight } from '@lucide/svelte';
	import type { NavItem } from '$lib/nav';

	let { items, current }: { items: NavItem[]; current?: string } = $props();

	const crumbs = $derived(
		current ? [...items.slice(0, -1), { ...items[items.length - 1], label: current }] : items
	);
</script>

<nav aria-label="Breadcrumb">
	<ol class="flex flex-wrap items-center gap-1 text-xs text-ink-muted">
		{#each crumbs as c, i (c.href)}
			<li class="flex items-center gap-1">
				{#if i < crumbs.length - 1}
					<a href={c.href} class="rounded-md transition-colors hover:text-ink">{c.label}</a>
					<ChevronRight size={14} class="text-ink-faint" />
				{:else}
					<span class="font-medium text-ink" aria-current="page">{c.label}</span>
				{/if}
			</li>
		{/each}
	</ol>
</nav>
