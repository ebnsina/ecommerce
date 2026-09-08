<script lang="ts">
	import { ArrowRight } from '@lucide/svelte';

	/**
	 * The heading above a row of products.
	 *
	 * An eyebrow, a title with real size to it, and a link that reads as an
	 * invitation rather than a control. The rhythm is the point: every band on
	 * the page opens the same way, so the page scans as one thing.
	 */
	let {
		eyebrow,
		title,
		subtitle,
		href,
		linkLabel = 'See all'
	}: {
		eyebrow?: string;
		title: string;
		subtitle?: string;
		href?: string;
		linkLabel?: string;
	} = $props();
</script>

<div class="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
	<div class="min-w-0">
		{#if eyebrow}
			<p class="text-xs font-semibold tracking-[0.12em] text-primary uppercase">{eyebrow}</p>
		{/if}
		<h2 class="mt-1.5 text-2xl font-semibold tracking-tight text-ink sm:text-[1.75rem]">
			{title}
		</h2>
		{#if subtitle}
			<p class="mt-1.5 max-w-xl text-sm text-ink-muted">{subtitle}</p>
		{/if}
	</div>

	{#if href}
		<a
			{href}
			class="group flex shrink-0 items-center gap-1.5 text-sm font-medium text-ink
			       transition-colors duration-[180ms] ease-brand hover:text-primary"
		>
			{linkLabel}
			<!-- The arrow travels on hover; 180ms, and it stays put under reduced motion. -->
			<ArrowRight
				size={16}
				class="transition-transform duration-[180ms] ease-brand group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
			/>
		</a>
	{/if}
</div>
