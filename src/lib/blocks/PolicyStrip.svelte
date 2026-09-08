<script lang="ts">
	import {
		RotateCcw,
		ShieldCheck,
		Truck,
		Headphones,
		CreditCard,
		BadgePercent
	} from '@lucide/svelte';

	const icons: Record<string, any> = {
		RotateCcw,
		ShieldCheck,
		Truck,
		Headphones,
		CreditCard,
		BadgePercent
	};

	let { props }: { props: Record<string, any> } = $props();
	const items = $derived(props.items ?? []);
</script>

{#if items.length}
	<section class="mx-auto max-w-7xl px-4 py-2">
		<div
			class="grid gap-4 rounded-3xl border border-border p-5 sm:grid-cols-2"
			style="--cols:{items.length}"
			class:lg:grid-cols-4={items.length >= 4}
			class:lg:grid-cols-3={items.length === 3}
		>
			{#each items as item (item.subtitle)}
				{@const Icon = icons[item.icon] ?? Truck}
				<a href={item.href || '#'} class="flex items-center gap-3">
					<Icon size={22} class="shrink-0 text-primary" />
					<span class="min-w-0">
						<span class="block truncate text-sm font-medium text-ink">{item.title}</span>
						<span class="block truncate text-xs text-ink-muted">{item.subtitle}</span>
					</span>
				</a>
			{/each}
		</div>
	</section>
{/if}
