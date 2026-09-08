<script lang="ts">
	import type { Snippet } from 'svelte';

	/** One row in a dropdown menu — a link, a button, or a destructive action. */
	let {
		href,
		onclick,
		danger = false,
		children
	}: {
		href?: string;
		onclick?: () => void;
		danger?: boolean;
		children: Snippet;
	} = $props();

	const cls = $derived(`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm
	             transition-colors duration-[180ms] ease-brand
	             ${danger ? 'text-sale hover:bg-sale/8' : 'text-ink hover:bg-surface-alt'}`);
</script>

{#if href}
	<a {href} role="menuitem" class={cls}>{@render children()}</a>
{:else}
	<button type="button" role="menuitem" class={cls} {onclick}>{@render children()}</button>
{/if}
