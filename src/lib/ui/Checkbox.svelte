<script lang="ts">
	import { Check, Minus } from '@lucide/svelte';
	import type { HTMLInputAttributes } from 'svelte/elements';

	let {
		checked = $bindable(false),
		label,
		hint,
		indeterminate = false,
		...rest
	}: {
		checked?: boolean;
		label?: string;
		hint?: string;
		indeterminate?: boolean;
	} & HTMLInputAttributes = $props();
</script>

<!-- Native input kept for a11y and form posting; visually replaced by our own box. -->
<label class="group flex cursor-pointer items-start gap-2.5 select-none">
	<input type="checkbox" bind:checked {indeterminate} class="peer sr-only" {...rest} />
	<span
		aria-hidden="true"
		class="mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border border-border bg-surface
		       transition-[background-color,border-color] duration-[180ms] ease-brand
		       group-hover:border-brand-300
		       peer-checked:border-primary peer-checked:bg-primary
		       peer-indeterminate:border-primary peer-indeterminate:bg-primary
		       peer-focus-visible:outline-2
		       peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary peer-disabled:opacity-50
		       peer-checked:[&>svg]:scale-100 peer-checked:[&>svg]:opacity-100"
	>
		{#if indeterminate}
			<Minus size={14} strokeWidth={3} class="text-white" />
		{:else}
			<Check
				size={14}
				strokeWidth={3}
				class="scale-75 text-white opacity-0 transition-[opacity,transform] duration-[180ms] ease-brand"
			/>
		{/if}
	</span>
	{#if label}
		<span class="flex flex-col gap-0.5">
			<span class="text-sm text-ink">{label}</span>
			{#if hint}<span class="text-xs text-ink-muted">{hint}</span>{/if}
		</span>
	{/if}
</label>
