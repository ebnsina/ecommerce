<script lang="ts">
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import { slide } from 'svelte/transition';
	import { ArrowLeft, Trash2, X } from '@lucide/svelte';
	import { formatTk } from '$lib/money';
	import { slideOpen } from '$lib/motion';
	import Button from '$lib/ui/Button.svelte';
	import Input from '$lib/ui/Input.svelte';
	import Textarea from '$lib/ui/Textarea.svelte';
	import Checkbox from '$lib/ui/Checkbox.svelte';
	import MediaPicker from '$lib/ui/MediaPicker.svelte';

	let { data, form } = $props();
	const init = untrack(() => data);

	let title = $state(init.bundle.title);
	let slug = $state(init.bundle.slug);
	let description = $state(init.bundle.description ?? '');
	let image = $state(init.bundle.image ?? '');
	let price = $state(init.bundle.price ? String(init.bundle.price / 100) : '');
	let active = $state(init.bundle.active);

	let items = $state((init.view?.items ?? []).map((i) => ({ productId: i.productId, qty: i.qty })));
	let search = $state('');

	const byId = $derived(new Map(data.catalog.map((p) => [p.id, p])));

	const matches = $derived(
		search.trim()
			? data.catalog
					.filter(
						(p) =>
							p.title.toLowerCase().includes(search.toLowerCase()) &&
							!items.some((i) => i.productId === p.id)
					)
					.slice(0, 8)
			: []
	);

	/* Worth is recomputed live so the saving is visible while pricing. */
	const worth = $derived(
		items.reduce((n, i) => n + (byId.get(i.productId)?.price ?? 0) * i.qty, 0)
	);
	const priceP = $derived(Math.round((Number(price) || 0) * 100));
	const saving = $derived(Math.max(0, worth - priceP));
</script>

<svelte:head><title>{title} · Bundles · Admin</title></svelte:head>

<a
	href="/admin/bundles"
	class="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
>
	<ArrowLeft size={15} />
	All bundles
</a>

<form method="POST" action="?/save" use:enhance class="mt-3">
	<input type="hidden" name="items" value={JSON.stringify(items)} />
	<input type="hidden" name="image" value={image} />

	<div class="flex flex-wrap items-start justify-between gap-4">
		<h1 class="text-2xl font-semibold tracking-tight text-ink">{title || 'Bundle'}</h1>
		<div class="flex gap-2">
			<Button variant="danger" formaction="?/remove">
				<Trash2 size={16} />
				Delete
			</Button>
			<Button type="submit">Save bundle</Button>
		</div>
	</div>

	{#if form?.error}
		<p
			class="mt-4 rounded-2xl border border-sale/30 bg-sale/8 px-4 py-3 text-sm text-sale"
			role="alert"
		>
			{form.error}
		</p>
	{/if}

	<div class="mt-6 grid gap-4 lg:grid-cols-3">
		<div class="flex flex-col gap-4 lg:col-span-2">
			<section class="rounded-3xl border border-border bg-surface p-5">
				<h2 class="mb-4 text-sm font-medium text-ink">Basics</h2>
				<div class="flex flex-col gap-4">
					<Input label="Name" name="title" bind:value={title} required />
					<Input label="Slug" name="slug" bind:value={slug} />
					<Textarea label="Description" name="description" bind:value={description} rows={3} />
					<MediaPicker label="Image" bind:value={image} />
				</div>
			</section>

			<section class="rounded-3xl border border-border bg-surface p-5">
				<h2 class="text-sm font-medium text-ink">Products in this bundle</h2>
				<p class="mt-0.5 text-xs text-ink-muted">
					At least two. The bundle shows on each of their product pages.
				</p>

				<div class="mt-4 flex flex-col gap-2">
					{#each items as item, i (item.productId)}
						{@const product = byId.get(item.productId)}
						<div
							class="flex items-center gap-3 rounded-2xl border border-border p-3"
							transition:slide={slideOpen()}
						>
							<span class="min-w-0 flex-1">
								<span class="block truncate text-sm text-ink"
									>{product?.title ?? 'Unknown product'}</span
								>
								<span class="num block text-xs text-ink-muted">
									{formatTk(product?.price ?? 0)} each
								</span>
							</span>
							<input
								type="number"
								min="1"
								class="num h-9 w-16 rounded-lg border border-border px-2 text-sm"
								value={item.qty}
								aria-label="Quantity"
								oninput={(e) => (items[i].qty = Math.max(1, Number(e.currentTarget.value) || 1))}
							/>
							<button
								type="button"
								class="grid size-8 place-items-center rounded-lg text-ink-faint hover:text-sale"
								aria-label="Remove"
								onclick={() => (items = items.filter((_, j) => j !== i))}
							>
								<X size={15} />
							</button>
						</div>
					{/each}

					<Input
						bind:value={search}
						placeholder="Search products to add"
						aria-label="Search products"
					/>
					{#if matches.length}
						<ul class="flex flex-col rounded-xl border border-border p-1">
							{#each matches as m (m.id)}
								<li>
									<button
										type="button"
										class="flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm text-ink hover:bg-surface-alt"
										onclick={() => {
											items = [...items, { productId: m.id, qty: 1 }];
											search = '';
										}}
									>
										<span class="truncate">{m.title}</span>
										<span class="num shrink-0 text-xs text-ink-muted">{formatTk(m.price)}</span>
									</button>
								</li>
							{/each}
						</ul>
					{/if}
				</div>
			</section>
		</div>

		<div class="flex flex-col gap-4">
			<section class="rounded-3xl border border-border bg-surface p-5">
				<h2 class="mb-4 text-sm font-medium text-ink">Price</h2>
				<div class="flex flex-col gap-4">
					<Input
						label="Bundle price (৳)"
						name="price"
						bind:value={price}
						numeric
						inputmode="decimal"
					/>

					<dl class="flex flex-col gap-1.5 text-sm">
						<div class="flex justify-between">
							<dt class="text-ink-muted">Bought separately</dt>
							<dd class="num text-ink">{formatTk(worth)}</dd>
						</div>
						<div class="flex justify-between">
							<dt class="text-ink-muted">Customer saves</dt>
							<dd class="num font-medium {saving > 0 ? 'text-success' : 'text-ink-faint'}">
								{formatTk(saving)}
							</dd>
						</div>
					</dl>

					{#if priceP > 0 && priceP >= worth && items.length > 1}
						<p class="text-xs text-star">
							This bundle costs at least as much as buying the items separately.
						</p>
					{/if}

					<Checkbox
						name="active"
						bind:checked={active}
						label="Live on the storefront"
						hint="Needs two or more products and a price."
					/>
				</div>
			</section>
		</div>
	</div>
</form>
