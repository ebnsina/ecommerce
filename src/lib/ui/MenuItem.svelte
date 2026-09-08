<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		href,
		danger = false,
		onclick,
		children
	}: { href?: string; danger?: boolean; onclick?: () => void; children: Snippet } = $props();

	const cls = $derived(
		'flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors duration-[180ms] ease-brand ' +
			(danger ? 'text-sale hover:bg-sale/8' : 'text-ink-muted hover:bg-surface-alt hover:text-ink')
	);
</script>

{#if href}
	<a {href} role="menuitem" class={cls}>{@render children()}</a>
{:else}
	<button type="button" role="menuitem" class={cls} {onclick}>{@render children()}</button>
{/if}
