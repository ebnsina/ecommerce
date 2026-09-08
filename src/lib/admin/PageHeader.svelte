<script lang="ts">
	import type { Snippet } from 'svelte';

	/** Title with its count on the left, the page's actions on the right. */
	let {
		title,
		count,
		description,
		actions
	}: {
		title: string;
		/** Shown beside the title. Omit where a count means nothing. */
		count?: number;
		description?: string;
		actions?: Snippet;
	} = $props();
</script>

<div class="flex flex-wrap items-start justify-between gap-4">
	<div>
		<h1 class="flex items-center gap-2 text-2xl font-semibold tracking-tight text-ink">
			{title}
			{#if count !== undefined}
				<span class="num rounded-lg bg-surface-alt px-2 py-0.5 text-sm font-medium text-ink-muted">
					{count}
				</span>
			{/if}
		</h1>
		{#if description}<p class="mt-1 text-sm text-ink-muted">{description}</p>{/if}
	</div>
	{#if actions}<div class="flex flex-wrap items-center gap-2">{@render actions()}</div>{/if}
</div>
