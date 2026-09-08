<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import { Plus } from '@lucide/svelte';
	import { formatTk } from '$lib/money';
	import { track } from '$lib/track';

	/**
	 * "Add this too." One row per suggestion with a single add button, rather
	 * than a grid of cards — at this point the shopper is trying to finish, and
	 * anything that reads as browsing costs an order.
	 *
	 * The suggestions come from what real buyers took alongside what is already
	 * in the cart.
	 */
	type Item = {
		id: string;
		title: string;
		slug: string;
		price: number;
		compareAtPrice: number | null;
		image: string | null;
	};

	let { items, heading = 'Often bought with this' }: { items: Item[]; heading?: string } = $props();
</script>

{#if items.length}
	<section class="rounded-3xl border border-border bg-surface p-5">
		<h2 class="text-sm font-medium text-ink">{heading}</h2>
		<ul class="mt-3 flex flex-col">
			{#each items as item (item.id)}
				<li class="flex items-center gap-3 border-b border-border py-3 last:border-0 last:pb-0">
					<a
						href="/demo/p/{item.slug}"
						class="grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-surface-alt"
					>
						{#if item.image}
							<img src={item.image} alt="" class="size-full object-cover" loading="lazy" />
						{/if}
					</a>
					<a href="/demo/p/{item.slug}" class="min-w-0 flex-1">
						<span class="line-clamp-2 text-sm text-ink">{item.title}</span>
						<span class="mt-0.5 flex items-baseline gap-1.5">
							<span class="num text-sm font-semibold text-ink">{formatTk(item.price)}</span>
							{#if item.compareAtPrice && item.compareAtPrice > item.price}
								<span class="num text-xs text-ink-faint line-through">
									{formatTk(item.compareAtPrice)}
								</span>
							{/if}
						</span>
					</a>
					<form
						method="POST"
						action="/demo/cart?/add"
						use:enhance={() =>
							async ({ result, update }) => {
								if (result.type !== 'failure' && result.type !== 'error')
									track({
										kind: 'add_to_cart',
										value: item.price,
										items: [{ id: item.id, name: item.title, price: item.price, quantity: 1 }]
									});
								await update();
							}}
					>
						<input type="hidden" name="productId" value={item.id} />
						<input type="hidden" name="qty" value="1" />
						<input type="hidden" name="redirectTo" value={page.url.pathname + page.url.search} />
						<button
							class="flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-border px-3
							       text-sm font-medium text-ink transition-colors duration-[180ms] ease-brand
							       hover:border-brand-300 hover:text-primary"
						>
							<Plus size={15} />
							Add
						</button>
					</form>
				</li>
			{/each}
		</ul>
	</section>
{/if}
