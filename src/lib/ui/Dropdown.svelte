<script lang="ts">
	import type { Snippet } from 'svelte';
	import { fly } from 'svelte/transition';
	import { flyUp, flyDown } from '$lib/motion';
	import { anchored } from './anchored';

	let {
		trigger,
		children,
		align = 'start',
		side = 'bottom',
		class: klass = ''
	}: {
		trigger: Snippet<[{ open: boolean }]>;
		children: Snippet<[{ close: () => void }]>;
		align?: 'start' | 'end';
		side?: 'top' | 'bottom';
		class?: string;
	} = $props();

	let open = $state(false);
	let root: HTMLDivElement;
	let triggerEl = $state<HTMLButtonElement | null>(null);
	/* The side asked for is a preference; `anchored` reports what actually fit. */
	let placed = $state<'top' | 'bottom'>('bottom');

	const close = () => (open = false);

	/** Close on outside click or Escape — window listeners only while open. */
	$effect(() => {
		if (!open) return;
		const onPointer = (e: PointerEvent) => {
			if (!root.contains(e.target as Node)) close();
		};
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				close();
				root.querySelector<HTMLElement>('[data-dropdown-trigger]')?.focus();
			}
		};
		window.addEventListener('pointerdown', onPointer);
		window.addEventListener('keydown', onKey);
		return () => {
			window.removeEventListener('pointerdown', onPointer);
			window.removeEventListener('keydown', onKey);
		};
	});
</script>

<div bind:this={root} class="relative {klass}">
	<button
		bind:this={triggerEl}
		type="button"
		data-dropdown-trigger
		aria-expanded={open}
		aria-haspopup="menu"
		class="w-full text-left"
		onclick={() => (open = !open)}
	>
		{@render trigger({ open })}
	</button>

	{#if open}
		<!-- Pinned to the viewport, so a scrolling sidebar or a card with
		     overflow-hidden cannot clip the menu. -->
		<div
			role="menu"
			tabindex="-1"
			use:anchored={{ to: triggerEl!, align, prefer: side, onSide: (s) => (placed = s) }}
			class="z-50 min-w-52 overflow-auto rounded-2xl border border-border bg-surface p-1.5"
			transition:fly={placed === 'top' ? flyDown() : flyUp()}
		>
			{@render children({ close })}
		</div>
	{/if}
</div>
