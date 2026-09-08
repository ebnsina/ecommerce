<script lang="ts">
	import { enhance } from '$app/forms';
	import { fade } from 'svelte/transition';
	import { Scale, X, ShoppingBag, Check, Minus } from '@lucide/svelte';
	import { formatTk, discountPercent } from '$lib/money';
	import { fadeIn } from '$lib/motion';
	import Rating from '$lib/shop/Rating.svelte';
	import Button from '$lib/ui/Button.svelte';

	let { data, form } = $props();

	/* Best-in-row is highlighted rather than every cell — the point of a compare
	   table is the difference, not the data. */
	const cheapest = $derived(Math.min(...data.items.map((i) => i.price)));
	const bestRated = $derived(Math.max(...data.items.map((i) => i.rating)));

	const rows = [
		{ key: 'price', label: 'Price' },
		{ key: 'rating', label: 'Rating' },
		{ key: 'brand', label: 'Brand' },
		{ key: 'availability', label: 'Availability' },
		{ key: 'categories', label: 'Category' },
		{ key: 'options', label: 'Options' },
		{ key: 'sold', label: 'Units sold' },
		{ key: 'description', label: 'Description' }
	];
</script>

<svelte:head><title>Compare · {data.settings.store.name}</title></svelte:head>

<div class="mx-auto max-w-7xl px-4 py-8">
	<div class="flex flex-wrap items-start justify-between gap-4">
		<div>
			<h1 class="text-2xl font-semibold tracking-tight text-ink">Compare products</h1>
			<p class="mt-1 text-sm text-ink-muted">
				{data.items.length
					? 'Side by side, so the differences are obvious.'
					: 'Add products from any listing to compare them here.'}
			</p>
		</div>
		{#if data.items.length}
			<form method="POST" action="?/clear" use:enhance>
				<Button variant="secondary" size="sm" type="submit">Clear all</Button>
			</form>
		{/if}
	</div>

	{#if form?.error}
		<p
			class="mt-4 rounded-2xl border border-sale/30 bg-sale/8 px-4 py-3 text-sm text-sale"
			role="alert"
		>
			{form.error}
		</p>
	{/if}

	{#if data.items.length === 0}
		<div class="mt-6 flex flex-col items-center gap-4 rounded-3xl border border-border px-6 py-20">
			<Scale size={26} class="text-ink-faint" />
			<p class="text-sm text-ink-muted">Nothing to compare yet.</p>
			<Button href="/search">Browse products</Button>
		</div>
	{:else}
		<!-- Horizontal scroll rather than wrapping: a compare table only works
		     when the columns stay aligned. -->
		<div class="mt-6 overflow-x-auto rounded-3xl border border-border bg-surface">
			<table class="w-full min-w-3xl text-sm">
				<thead>
					<tr>
						<th class="w-36 border-b border-border p-4 text-left align-top"></th>
						{#each data.items as p (p.id)}
							<th class="min-w-56 border-b border-l border-border p-4 text-left align-top">
								<div class="relative" transition:fade={fadeIn()}>
									<form
										method="POST"
										action="?/remove"
										use:enhance
										class="absolute -top-1 -right-1 z-10"
									>
										<input type="hidden" name="productId" value={p.id} />
										<button
											class="grid size-7 place-items-center rounded-lg bg-surface-alt text-ink-muted transition-colors hover:text-sale"
											aria-label="Remove {p.title} from comparison"
										>
											<X size={14} />
										</button>
									</form>

									<a href="/p/{p.slug}" class="block">
										<span class="block aspect-square overflow-hidden rounded-2xl bg-surface-alt">
											{#if p.image}
												<img src={p.image} alt="" class="size-full object-cover" loading="lazy" />
											{/if}
										</span>
										<span class="mt-2 line-clamp-2 block font-medium text-ink">{p.title}</span>
									</a>
								</div>
							</th>
						{/each}
					</tr>
				</thead>

				<tbody>
					{#each rows as row (row.key)}
						<tr>
							<th class="border-b border-border p-4 text-left align-top font-medium text-ink-muted">
								{row.label}
							</th>
							{#each data.items as p (p.id)}
								<td class="border-b border-l border-border p-4 align-top">
									{#if row.key === 'price'}
										<span class="flex flex-wrap items-baseline gap-2">
											<span
												class="num font-semibold {p.price === cheapest && data.items.length > 1
													? 'text-success'
													: 'text-ink'}"
											>
												{formatTk(p.price)}
											</span>
											{#if discountPercent(p.price, p.compareAtPrice) > 0}
												<span class="num text-xs text-ink-faint line-through">
													{formatTk(p.compareAtPrice!)}
												</span>
											{/if}
										</span>
										{#if p.price === cheapest && data.items.length > 1}
											<span class="mt-1 flex items-center gap-1 text-xs text-success">
												<Check size={12} />
												Lowest price
											</span>
										{/if}
									{:else if row.key === 'rating'}
										{#if p.reviewCount > 0}
											<Rating rating={p.rating} count={p.reviewCount} size={13} />
											{#if p.rating === bestRated && data.items.length > 1}
												<span class="mt-1 flex items-center gap-1 text-xs text-success">
													<Check size={12} />
													Best rated
												</span>
											{/if}
										{:else}
											<span class="text-ink-faint">No reviews yet</span>
										{/if}
									{:else if row.key === 'brand'}
										<span class="text-ink">{p.brand || '—'}</span>
									{:else if row.key === 'availability'}
										{#if p.hasVariants || p.stock > 0}
											<span class="text-success">In stock</span>
										{:else}
											<span class="text-sale">Out of stock</span>
										{/if}
									{:else if row.key === 'categories'}
										<span class="text-ink">{p.categories.join(', ') || '—'}</span>
									{:else if row.key === 'options'}
										{#if p.options.length}
											{#each p.options as o (o.name)}
												<span class="block text-ink">
													<span class="text-ink-muted">{o.name}:</span>
													{o.values.join(', ')}
												</span>
											{/each}
										{:else}
											<Minus size={14} class="text-ink-faint" />
										{/if}
									{:else if row.key === 'sold'}
										<span class="num text-ink">{p.soldCount}</span>
									{:else}
										<span class="line-clamp-4 text-ink-muted">{p.description || '—'}</span>
									{/if}
								</td>
							{/each}
						</tr>
					{/each}

					<tr>
						<td class="p-4"></td>
						{#each data.items as p (p.id)}
							<td class="border-l border-border p-4">
								<form method="POST" action="/cart?/add" use:enhance>
									<input type="hidden" name="productId" value={p.id} />
									<input type="hidden" name="qty" value="1" />
									<input type="hidden" name="redirectTo" value="/compare" />
									<Button size="sm" block type="submit" disabled={!p.hasVariants && p.stock <= 0}>
										<ShoppingBag size={15} />
										Add to cart
									</Button>
								</form>
							</td>
						{/each}
					</tr>
				</tbody>
			</table>
		</div>
	{/if}
</div>
