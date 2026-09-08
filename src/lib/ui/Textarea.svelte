<script lang="ts">
	import type { HTMLTextareaAttributes } from 'svelte/elements';

	let {
		value = $bindable(''),
		label,
		hint,
		rows = 4,
		id = `t-${Math.random().toString(36).slice(2, 8)}`,
		class: klass = '',
		...rest
	}: {
		value?: string;
		label?: string;
		hint?: string;
		rows?: number;
		id?: string;
		class?: string;
	} & HTMLTextareaAttributes = $props();
</script>

<div class="flex flex-col gap-1.5 {klass}">
	{#if label}<label for={id} class="text-sm font-medium text-ink">{label}</label>{/if}
	<textarea
		{id}
		{rows}
		bind:value
		class="resize-y rounded-xl border border-border bg-surface px-3.5 py-2.5
		       text-sm text-ink transition-colors duration-[180ms] ease-brand placeholder:text-ink-faint"
		{...rest}></textarea>
	{#if hint}<p class="text-xs text-ink-muted">{hint}</p>{/if}
</div>
