<script lang="ts">
	import { enhance } from '$app/forms';
	import { track } from '$lib/track';
	import { Plus, PackagePlus, ShoppingBag } from '@lucide/svelte';
	import { formatTk } from '$lib/money';
	import Button from '$lib/ui/Button.svelte';

	type Member = {
		productId: string;
		title: string;
		slug: string;
		image: string | null;
		qty: number;
	};
	type Bundle = {
		id: string;
		title: string;
		description: string | null;
		price: number;
		worth: number;
		saving: number;
		inStock: boolean;
		items: Member[];
	};

	let { bundle, redirectTo }: { bundle: Bundle; redirectTo: string } = $props();
</script>

<section class="mt-6 rounded-3xl border border-border p-5">
	<h2 class="flex items-center gap-2 text-sm font-medium text-ink">
		<PackagePlus size={16} class="text-primary" />
		{bundle.title}
	</h2>
	{#if bundle.description}
		<p class="mt-1 text-xs text-ink-muted">{bundle.description}</p>
	{/if}

	<!-- The parts, read as a sum: image + image + image = one price. -->
	<div class="mt-4 flex flex-wrap items-center gap-2">
		{#each bundle.items as item, i (item.productId)}
			{#if i > 0}
				<Plus size={14} class="shrink-0 text-ink-faint" />
			{/if}
			<a href="/demo/p/{item.slug}" class="flex items-center gap-2" title={item.title}>
				<span class="size-14 shrink-0 overflow-hidden rounded-xl bg-surface-alt">
					{#if item.image}
						<img src={item.image} alt={item.title} class="size-full object-cover" loading="lazy" />
					{/if}
				</span>
				{#if item.qty > 1}<span class="num text-xs text-ink-muted">×{item.qty}</span>{/if}
			</a>
		{/each}
	</div>

	<ul class="mt-3 flex flex-col gap-1">
		{#each bundle.items as item (item.productId)}
			<li class="truncate text-xs text-ink-muted">
				{item.qty > 1 ? `${item.qty} × ` : ''}{item.title}
			</li>
		{/each}
	</ul>

	<div class="mt-4 flex flex-wrap items-end justify-between gap-3">
		<div>
			<p class="flex items-baseline gap-2">
				<span class="num text-xl font-semibold text-ink">{formatTk(bundle.price)}</span>
				{#if bundle.saving > 0}
					<span class="num text-sm text-ink-faint line-through">{formatTk(bundle.worth)}</span>
				{/if}
			</p>
			{#if bundle.saving > 0}
				<p class="num text-xs font-medium text-success">Save {formatTk(bundle.saving)}</p>
			{/if}
		</div>

		<form
			method="POST"
			action="/demo/cart?/addBundle"
			use:enhance={() =>
				async ({ result, update }) => {
					// The action redirects back, so anything but a failure means the
					// set went in. Each part is reported at its allocated share.
					if (result.type !== 'failure' && result.type !== 'error')
						track({
							kind: 'add_to_cart',
							value: bundle.price,
							items: bundle.items.map((i) => ({
								id: i.productId,
								name: i.title,
								quantity: 1
							}))
						});
					await update();
				}}
		>
			<input type="hidden" name="bundleId" value={bundle.id} />
			<input type="hidden" name="redirectTo" value={redirectTo} />
			<Button type="submit" disabled={!bundle.inStock}>
				<ShoppingBag size={16} />
				{bundle.inStock ? 'Add all to cart' : 'Out of stock'}
			</Button>
		</form>
	</div>
</section>
