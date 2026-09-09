<script lang="ts">
	import { formatTk } from '$lib/money';
	import { SHOP } from '$lib/paths';
	import Button from '$lib/ui/Button.svelte';
	import Stepper from './Stepper.svelte';
	import Img from './Img.svelte';
	import { ShoppingBasket } from '@lucide/svelte';

	type Line = { id: string; productId: string; qty: number };

	let {
		lines,
		subtotal,
		items
	}: {
		lines: Line[];
		subtotal: number;
		/** Enough of each product to draw the row. */
		items: { id: string; slug: string; title: string; image: string | null; unitPrice: number }[];
	} = $props();

	const rows = $derived(
		lines
			.map((l) => ({ line: l, product: items.find((p) => p.id === l.productId) }))
			.filter((r) => r.product !== undefined)
	);
</script>

<!-- The basket stands on the page instead of hiding behind an icon. A grocery
     order is twenty small decisions and the running total is the thing being
     decided against, so it is on screen while the shopping happens. Desktop
     only: on a phone the header's own total is the whole screen's width. -->
<aside
	class="hidden w-72 shrink-0 border-l border-border bg-surface xl:flex xl:flex-col"
	aria-label="Your basket"
>
	<div class="flex min-h-0 flex-1 flex-col">
		<p
			class="flex items-center gap-2 border-b border-border px-4 py-3 text-sm font-medium text-ink"
		>
			<ShoppingBasket size={16} aria-hidden="true" />
			Your basket
		</p>

		{#if rows.length}
			<ul class="min-h-0 flex-1 divide-y divide-border overflow-y-auto">
				{#each rows as { line, product } (line.id)}
					<li class="flex items-center gap-3 px-3 py-2.5">
						<a
							href="{SHOP}/p/{product!.slug}"
							class="size-10 shrink-0 overflow-hidden rounded-lg bg-surface-alt"
							aria-hidden="true"
							tabindex="-1"
						>
							{#if product!.image}
								<Img src={product!.image} width={80} height={80} class="size-full object-cover" />
							{/if}
						</a>
						<span class="min-w-0 flex-1">
							<a
								href="{SHOP}/p/{product!.slug}"
								class="block truncate text-xs text-ink hover:text-primary"
							>
								{product!.title}
							</a>
							<span class="num block text-xs font-medium text-ink">
								{formatTk(product!.unitPrice * line.qty)}
							</span>
						</span>
						<Stepper productId={line.productId} title={product!.title} />
					</li>
				{/each}
			</ul>

			<div class="mt-auto border-t border-border p-3">
				<p class="flex items-center justify-between text-sm">
					<span class="text-ink-muted">Subtotal</span>
					<span class="num font-semibold text-ink">{formatTk(subtotal)}</span>
				</p>
				<Button href="{SHOP}/checkout" class="mt-3 w-full justify-center">Checkout</Button>
				<p class="mt-2 text-center text-[0.6875rem] text-ink-muted">
					Delivery is worked out at checkout.
				</p>
			</div>
		{:else}
			<p class="px-4 py-8 text-center text-xs text-ink-muted">
				Nothing in it yet. Tap the plus on anything to start.
			</p>
		{/if}
	</div>
</aside>
