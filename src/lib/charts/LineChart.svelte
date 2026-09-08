<script lang="ts">
	/**
	 * Single-series change-over-time. One hue (identity is in the title, so no
	 * legend), 2px line, recessive grid, crosshair + tooltip on hover.
	 * Hand-rolled SVG — a charting library for one path would be silly.
	 */
	type Point = { label: string; value: number };

	let {
		data,
		height = 200,
		format = (n: number) => String(n),
		hue = 'var(--color-primary)'
	}: {
		data: Point[];
		height?: number;
		format?: (n: number) => string;
		hue?: string;
	} = $props();

	const W = 640;
	const PAD = { t: 12, r: 12, b: 24, l: 8 };

	const max = $derived(Math.max(1, ...data.map((d) => d.value)));
	const innerW = $derived(W - PAD.l - PAD.r);
	const innerH = $derived(height - PAD.t - PAD.b);

	const x = (i: number) =>
		PAD.l + (data.length < 2 ? innerW / 2 : (i / (data.length - 1)) * innerW);
	const y = (v: number) => PAD.t + innerH - (v / max) * innerH;

	const line = $derived(data.map((d, i) => `${i ? 'L' : 'M'}${x(i)},${y(d.value)}`).join(' '));
	const area = $derived(
		data.length
			? `${line} L${x(data.length - 1)},${PAD.t + innerH} L${x(0)},${PAD.t + innerH} Z`
			: ''
	);

	let hover = $state<number | null>(null);
	let svgEl: SVGSVGElement;

	function onMove(e: PointerEvent) {
		const box = svgEl.getBoundingClientRect();
		const px = ((e.clientX - box.left) / box.width) * W;
		let best = 0;
		for (let i = 1; i < data.length; i++) {
			if (Math.abs(x(i) - px) < Math.abs(x(best) - px)) best = i;
		}
		hover = best;
	}

	const uid = `lc-${Math.random().toString(36).slice(2, 7)}`;
</script>

<div class="relative">
	<svg
		bind:this={svgEl}
		viewBox="0 0 {W} {height}"
		class="w-full"
		style="height:{height}px"
		role="img"
		aria-label="Line chart"
		onpointermove={onMove}
		onpointerleave={() => (hover = null)}
	>
		<defs>
			<linearGradient id={uid} x1="0" y1="0" x2="0" y2="1">
				<stop offset="0%" stop-color={hue} stop-opacity="0.16" />
				<stop offset="100%" stop-color={hue} stop-opacity="0" />
			</linearGradient>
		</defs>

		<!-- recessive gridlines -->
		{#each [0, 0.5, 1] as t (t)}
			<line
				x1={PAD.l}
				x2={W - PAD.r}
				y1={PAD.t + innerH * t}
				y2={PAD.t + innerH * t}
				stroke="var(--color-border)"
				stroke-width="1"
			/>
		{/each}

		{#if data.length}
			<path d={area} fill="url(#{uid})" />
			<path
				d={line}
				fill="none"
				stroke={hue}
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		{/if}

		{#if hover !== null && data[hover]}
			<line
				x1={x(hover)}
				x2={x(hover)}
				y1={PAD.t}
				y2={PAD.t + innerH}
				stroke="var(--color-border)"
				stroke-width="1"
			/>
			<!-- 2px surface ring keeps the marker legible over the line -->
			<circle
				cx={x(hover)}
				cy={y(data[hover].value)}
				r="5"
				fill={hue}
				stroke="var(--color-surface)"
				stroke-width="2"
			/>
		{/if}

		<!-- first / middle / last labels only — never one per point -->
		{#each data as d, i (d.label)}
			{#if data.length > 1 && (i === 0 || i === data.length - 1 || i === Math.floor(data.length / 2))}
				<text
					x={x(i)}
					y={height - 6}
					text-anchor={i === 0 ? 'start' : i === data.length - 1 ? 'end' : 'middle'}
					class="num"
					font-size="11"
					fill="var(--color-ink-faint)"
				>
					{d.label}
				</text>
			{/if}
		{/each}
	</svg>

	{#if hover !== null && data[hover]}
		<div
			class="pointer-events-none absolute -top-1 z-10 -translate-x-1/2 rounded-xl border
			       border-border bg-surface px-2.5 py-1.5"
			style="left:{(x(hover) / W) * 100}%"
		>
			<p class="text-[11px] whitespace-nowrap text-ink-muted">{data[hover].label}</p>
			<p class="num text-sm font-semibold text-ink">{format(data[hover].value)}</p>
		</div>
	{/if}
</div>
