<script lang="ts">
	import { reduced } from '$lib/motion';

	/**
	 * Segmented tabs with an indicator that slides between items.
	 *
	 * The indicator is one absolutely-positioned element measured from the active
	 * button, so it animates smoothly regardless of label widths — no per-tab
	 * width guessing, and it re-measures when the container resizes.
	 */
	type Tab = { value: string; label: string; badge?: number };

	let {
		tabs,
		value = $bindable(),
		onchange,
		class: klass = ''
	}: { tabs: Tab[]; value: string; onchange?: (value: string) => void; class?: string } = $props();

	let list = $state<HTMLDivElement | null>(null);
	let buttons: HTMLButtonElement[] = $state([]);
	let indicator = $state({ left: 0, width: 0, ready: false });

	function measure() {
		const i = tabs.findIndex((t) => t.value === value);
		const el = buttons[i];
		if (!el || !list) return;
		indicator = { left: el.offsetLeft, width: el.offsetWidth, ready: true };
	}

	$effect(() => {
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions -- read to register a reactive dependency
		value;
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions -- read to register a reactive dependency
		tabs.length;
		measure();
	});

	/* Labels reflow on resize and after fonts load — re-measure both times. */
	$effect(() => {
		if (!list) return;
		const ro = new ResizeObserver(measure);
		ro.observe(list);
		for (const b of buttons) if (b) ro.observe(b);
		document.fonts?.ready.then(measure);
		return () => ro.disconnect();
	});

	/** Arrow keys move between tabs, as a tablist should. */
	function onKey(e: KeyboardEvent) {
		const i = tabs.findIndex((t) => t.value === value);
		let next: number;
		if (e.key === 'ArrowRight') next = (i + 1) % tabs.length;
		else if (e.key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length;
		else if (e.key === 'Home') next = 0;
		else if (e.key === 'End') next = tabs.length - 1;
		else return;

		e.preventDefault();
		value = tabs[next].value;
		onchange?.(value);
		buttons[next]?.focus();
	}
</script>

<!-- Track: the shadcn TabsList shape — a soft fill, no border. The token sits a
     step under surface-alt so it still separates on the admin's own ground. -->
<div
	bind:this={list}
	role="tablist"
	tabindex="-1"
	class="relative inline-flex h-9 w-fit max-w-full [scrollbar-width:none] items-center justify-center
	       overflow-x-auto rounded-lg bg-track p-[3px] [&::-webkit-scrollbar]:hidden {klass}"
	onkeydown={onKey}
>
	<!-- The moving pill. shadcn uses a soft shadow here rather than a border. -->
	<span
		aria-hidden="true"
		class="absolute inset-y-[3px] rounded-md bg-surface shadow-sm
		       {indicator.ready ? 'opacity-100' : 'opacity-0'}
		       {reduced() ? '' : 'transition-[left,width,opacity] duration-[280ms] ease-brand'}"
		style="left: {indicator.left}px; width: {indicator.width}px"
	></span>

	{#each tabs as tab, i (tab.value)}
		<button
			bind:this={buttons[i]}
			type="button"
			role="tab"
			aria-selected={value === tab.value}
			tabindex={value === tab.value ? 0 : -1}
			class="relative z-10 inline-flex h-full shrink-0 items-center justify-center gap-1.5 rounded-md
			       px-3 py-1 text-sm font-medium whitespace-nowrap transition-colors duration-[180ms] ease-brand
			       {value === tab.value ? 'text-ink' : 'text-ink-muted hover:text-ink'}"
			onclick={() => {
				value = tab.value;
				onchange?.(tab.value);
			}}
		>
			{tab.label}
			{#if tab.badge}
				<span
					class="num grid h-4.5 min-w-4.5 place-items-center rounded px-1 text-[11px] font-semibold
					       {value === tab.value ? 'bg-primary text-white' : 'bg-track text-ink-muted'}"
				>
					{tab.badge}
				</span>
			{/if}
		</button>
	{/each}
</div>
