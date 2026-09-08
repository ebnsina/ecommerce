<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		label,
		value,
		note,
		tone = 'default',
		icon
	}: {
		label: string;
		value: string;
		note?: string;
		tone?: 'default' | 'warn';
		icon?: Snippet;
	} = $props();
</script>

<div class="rounded-3xl border border-border bg-surface p-5">
	<div class="flex items-start justify-between gap-3">
		<p class="text-sm text-ink-muted">{label}</p>
		{#if icon}
			<span class="text-ink-faint">{@render icon()}</span>
		{/if}
	</div>
	<p class="num mt-2 text-2xl font-semibold {tone === 'warn' ? 'text-sale' : 'text-ink'}">
		{value}
	</p>
	{#if note}<p class="mt-1 text-xs text-ink-faint">{note}</p>{/if}
</div>
