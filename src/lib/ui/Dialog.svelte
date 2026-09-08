<script lang="ts">
	import type { Snippet } from 'svelte';
	import { X } from '@lucide/svelte';

	/** Wraps the native <dialog> — it gives us the top layer, focus trap,
	    Escape handling and inert background for free. */
	let {
		open = $bindable(false),
		title,
		description,
		width = 'md',
		children,
		footer
	}: {
		open?: boolean;
		title: string;
		description?: string;
		width?: 'sm' | 'md' | 'lg';
		children: Snippet;
		footer?: Snippet;
	} = $props();

	let el = $state<HTMLDialogElement | null>(null);

	const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' };

	$effect(() => {
		if (!el) return;
		if (open && !el.open) el.showModal();
		if (!open && el.open) el.close();
	});
</script>

<dialog
	bind:this={el}
	onclose={() => (open = false)}
	onclick={(e) => {
		if (e.target === el) open = false; // backdrop click
	}}
	class="m-auto w-[calc(100%-2rem)] bg-surface {widths[width]} rounded-3xl border border-border p-0
	       backdrop:bg-ink/30 backdrop:backdrop-blur-sm"
>
	{#if open}
		<div class="flex items-start gap-4 px-6 pt-6">
			<div class="min-w-0 flex-1">
				<h2 class="text-lg font-semibold tracking-tight text-ink">{title}</h2>
				{#if description}<p class="mt-1 text-sm text-ink-muted">{description}</p>{/if}
			</div>
			<button
				type="button"
				aria-label="Close"
				class="-mt-1 -mr-2 grid size-9 shrink-0 place-items-center rounded-xl text-ink-muted
				       transition-colors duration-[180ms] ease-brand hover:bg-surface-alt hover:text-ink"
				onclick={() => (open = false)}
			>
				<X size={18} />
			</button>
		</div>

		<div class="px-6 py-5">{@render children()}</div>

		{#if footer}
			<div class="flex justify-end gap-2 border-t border-border px-6 py-4">{@render footer()}</div>
		{/if}
	{/if}
</dialog>
