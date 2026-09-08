<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	let {
		group = $bindable(),
		value,
		label,
		hint,
		...rest
	}: {
		group?: string;
		value: string;
		label?: string;
		hint?: string;
	} & HTMLInputAttributes = $props();
</script>

<label class="group flex cursor-pointer items-start gap-2.5 select-none">
	<input type="radio" bind:group {value} class="peer sr-only" {...rest} />
	<span
		aria-hidden="true"
		class="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border border-border bg-surface
		       transition-[border-color] duration-[180ms] ease-brand
		       group-hover:border-brand-300 peer-checked:border-[6px] peer-checked:border-primary
		       peer-focus-visible:outline-2
		       peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary peer-disabled:opacity-50"
	></span>
	{#if label}
		<span class="flex flex-col gap-0.5">
			<span class="text-sm text-ink">{label}</span>
			{#if hint}<span class="text-xs text-ink-muted">{hint}</span>{/if}
		</span>
	{/if}
</label>
