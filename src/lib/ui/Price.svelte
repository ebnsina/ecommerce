<script lang="ts">
	import { formatTk, discountPercent, type Poisha } from '$lib/money';

	let {
		price,
		compareAt = null,
		size = 'md'
	}: { price: Poisha; compareAt?: Poisha | null; size?: 'sm' | 'md' | 'lg' } = $props();

	const off = $derived(discountPercent(price, compareAt));
	const scale = { sm: 'text-sm', md: 'text-base', lg: 'text-xl' };
</script>

<span class="flex flex-wrap items-baseline gap-2">
	<span class="num {scale[size]} font-semibold text-ink">{formatTk(price)}</span>
	{#if off > 0 && compareAt}
		<span class="num text-xs text-ink-faint line-through">{formatTk(compareAt)}</span>
		<span class="num rounded-xl bg-sale/10 px-1.5 py-0.5 text-[11px] font-medium text-sale">
			-{off}%
		</span>
	{/if}
</span>
