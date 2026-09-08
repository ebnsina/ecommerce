<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	let {
		value = $bindable(),
		label,
		hint,
		error,
		id = `f-${Math.random().toString(36).slice(2, 8)}`,
		numeric = false,
		class: klass = '',
		...rest
	}: {
		value?: string | number;
		label?: string;
		hint?: string;
		error?: string;
		id?: string;
		/** prices, phone numbers, quantities — renders in Geist Mono */
		numeric?: boolean;
		class?: string;
	} & HTMLInputAttributes = $props();
</script>

<div class="flex flex-col gap-1.5 {klass}">
	{#if label}
		<label for={id} class="text-sm font-medium text-ink">{label}</label>
	{/if}
	<input
		{id}
		bind:value
		aria-invalid={error ? 'true' : undefined}
		aria-describedby={error || hint ? `${id}-msg` : undefined}
		class="h-11 rounded-xl border border-border bg-surface px-3.5 text-sm text-ink
		       transition-colors duration-[180ms] ease-brand placeholder:text-ink-faint
		       disabled:bg-surface-alt disabled:text-ink-faint
		       {error ? 'border-sale' : ''} {numeric ? 'num' : ''}"
		{...rest}
	/>
	{#if error || hint}
		<p id="{id}-msg" class="text-xs {error ? 'text-sale' : 'text-ink-muted'}">{error ?? hint}</p>
	{/if}
</div>
