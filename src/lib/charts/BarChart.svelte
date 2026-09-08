<script lang="ts">
	/**
	 * Horizontal magnitude bars — one hue, values direct-labelled, no axis.
	 * Rounded data-end anchored to the baseline (4px), 2px gap between bars.
	 */
	type Bar = { label: string; value: number; hue?: string };

	let { data, format = (n: number) => String(n) }: { data: Bar[]; format?: (n: number) => string } =
		$props();

	const max = $derived(Math.max(1, ...data.map((d) => d.value)));
	let hover = $state<number | null>(null);
</script>

<ul class="flex flex-col gap-3">
	{#each data as d, i (d.label)}
		<li
			class="flex items-center gap-3"
			onpointerenter={() => (hover = i)}
			onpointerleave={() => (hover = null)}
		>
			<span class="w-28 shrink-0 truncate text-xs text-ink-muted capitalize">{d.label}</span>
			<span class="relative h-6 flex-1 overflow-hidden rounded-md bg-surface-alt">
				<span
					class="absolute inset-y-0 left-0 rounded-r-[4px] transition-[width,opacity] duration-[280ms] ease-brand"
					style="width:{Math.max(2, (d.value / max) * 100)}%;
					       background:{d.hue ?? 'var(--color-primary)'};
					       opacity:{hover === null || hover === i ? 1 : 0.55}"
				></span>
			</span>
			<span class="num w-14 shrink-0 text-right text-sm font-medium text-ink">
				{format(d.value)}
			</span>
		</li>
	{/each}
</ul>
