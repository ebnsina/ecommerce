<script lang="ts">
	import type { Snippet } from 'svelte';

	/**
	 * Neutral tag with a coloured icon. Same rule as the order status badge:
	 * the chip stays legible, the icon carries the meaning.
	 */
	let {
		icon,
		color = 'var(--color-ink-muted)',
		children
	}: { icon?: Snippet; color?: string; children: Snippet } = $props();
</script>

<span
	class="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-surface
	       px-2 py-0.5 text-xs font-medium whitespace-nowrap text-ink"
>
	{#if icon}<span class="shrink-0" style="color: {color}">{@render icon()}</span>{/if}
	{@render children()}
</span>
