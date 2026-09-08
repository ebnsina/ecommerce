<script lang="ts">
	import { enhance } from '$app/forms';
	import { fade } from 'svelte/transition';
	import { Trash2, Minus, Plus, ShoppingBag, ArrowRight, TriangleAlert } from '@lucide/svelte';
	import { formatTk } from '$lib/money';
	import { fadeIn } from '$lib/motion';
	import Button from '$lib/ui/Button.svelte';

	let { data, form } = $props();
</script>

<svelte:head><title>Cart · {data.settings.store.name}</title></svelte:head>

<div class="mx-auto max-w-7xl px-4 py-8">
	<h1 class="text-2xl font-semibold tracking-tight text-ink">Your cart</h1>

	{#if form?.error}
		<p
			class="mt-4 rounded-2xl border border-sale/30 bg-sale/8 px-4 py-3 text-sm text-sale"
			role="alert"
		>
			{form.error}
		</p>
	{/if}

	{#if data.lines.length === 0}
		<div class="mt-6 flex flex-col items-center gap-4 rounded-3xl border border-border px-6 py-20">
			<ShoppingBag size={28} class="text-ink-faint" />
			<p class="text-sm text-ink-muted">Your cart is empty.</p>
			<Button href="/search">Start shopping</Button>
		</div>
	{:else}
		<div class="mt-6 grid gap-6 lg:grid-cols-[1fr_20rem]">
			<div class="overflow-hidden rounded-3xl border border-border bg-surface">
				{#each data.lines as line (line.id)}
					<div
						class="flex gap-4 border-b border-border p-4 last:border-0"
						transition:fade={fadeIn()}
					>
						<a
							href="/p/{line.slug}"
							class="size-20 shrink-0 overflow-hidden rounded-2xl bg-surface-alt"
						>
							{#if line.image}
								<img src={line.image} alt="" class="size-full object-cover" />
							{/if}
						</a>

						<div class="flex min-w-0 flex-1 flex-col gap-1">
							<a href="/p/{line.slug}" class="text-sm font-medium text-ink hover:text-primary">
								{line.title}
							</a>
							{#if line.optionLabel}
								<p class="text-xs text-ink-muted">{line.optionLabel}</p>
							{/if}
							<p class="num text-xs text-ink-muted">{formatTk(line.unitPrice)} each</p>

							{#if line.qty > line.stock}
								<p class="flex items-center gap-1.5 text-xs text-sale">
									<TriangleAlert size={13} />
									Only <span class="num">{line.stock}</span> left — reduce the quantity to continue.
								</p>
							{/if}

							<div class="mt-auto flex items-center gap-3 pt-2">
								<div class="flex h-9 items-center rounded-xl border border-border">
									<form method="POST" action="?/setQty" use:enhance>
										<input type="hidden" name="id" value={line.id} />
										<input type="hidden" name="qty" value={line.qty - 1} />
										<button
											class="grid size-8 place-items-center text-ink-muted hover:text-ink"
											aria-label="Decrease quantity of {line.title}"
										>
											<Minus size={14} />
										</button>
									</form>
									<span class="num w-9 text-center text-sm font-medium text-ink">{line.qty}</span>
									<form method="POST" action="?/setQty" use:enhance>
										<input type="hidden" name="id" value={line.id} />
										<input type="hidden" name="qty" value={line.qty + 1} />
										<button
											class="grid size-8 place-items-center text-ink-muted hover:text-ink disabled:opacity-40"
											aria-label="Increase quantity of {line.title}"
											disabled={line.qty >= line.stock}
										>
											<Plus size={14} />
										</button>
									</form>
								</div>

								<form method="POST" action="?/remove" use:enhance>
									<input type="hidden" name="id" value={line.id} />
									<button
										class="flex items-center gap-1.5 text-xs text-ink-faint transition-colors hover:text-sale"
									>
										<Trash2 size={14} />
										Remove
									</button>
								</form>
							</div>
						</div>

						<p class="num shrink-0 text-sm font-semibold text-ink">{formatTk(line.lineTotal)}</p>
					</div>
				{/each}
			</div>

			<aside class="h-fit rounded-3xl border border-border bg-surface p-5 lg:sticky lg:top-28">
				<h2 class="text-sm font-medium text-ink">Order summary</h2>
				<dl class="mt-4 flex flex-col gap-2.5 text-sm">
					<div class="flex justify-between">
						<dt class="text-ink-muted">Subtotal (<span class="num">{data.count}</span> items)</dt>
						<dd class="num font-medium text-ink">{formatTk(data.subtotal)}</dd>
					</div>
					<div class="flex justify-between">
						<dt class="text-ink-muted">Delivery</dt>
						<dd class="text-xs text-ink-muted">Calculated at checkout</dd>
					</div>
				</dl>
				<div class="mt-4 flex justify-between border-t border-border pt-4">
					<span class="font-medium text-ink">Total</span>
					<span class="num text-lg font-semibold text-ink">{formatTk(data.subtotal)}</span>
				</div>

				<Button href="/checkout" block class="mt-5" disabled={data.problems.length > 0}>
					Checkout
					<ArrowRight size={16} />
				</Button>
				{#if data.problems.length}
					<p class="mt-2 text-xs text-sale">Fix the quantities above to continue.</p>
				{/if}
			</aside>
		</div>
	{/if}
</div>
