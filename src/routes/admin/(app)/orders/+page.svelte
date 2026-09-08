<script lang="ts">
	import { untrack } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { Search, ShoppingCart } from '@lucide/svelte';
	import { formatTk } from '$lib/money';
	import { formatPhone } from '$lib/phone';
	import OrderStatus from '$lib/shop/OrderStatus.svelte';
	import Input from '$lib/ui/Input.svelte';

	let { data } = $props();
	let q = $state(untrack(() => data.filters.q));

	function apply(patch: Record<string, string>) {
		const params = new URLSearchParams(page.url.searchParams);
		for (const [k, v] of Object.entries(patch)) v ? params.set(k, v) : params.delete(k);
		params.delete('page');
		goto(`?${params}`, { keepFocus: true, noScroll: true });
	}

	let timer: ReturnType<typeof setTimeout>;
	const search = (v: string) => {
		clearTimeout(timer);
		timer = setTimeout(() => apply({ q: v }), 250);
	};

	const tabs = [
		{ value: '', label: 'All' },
		{ value: 'pending', label: 'Awaiting call' },
		{ value: 'confirmed', label: 'Confirmed' },
		{ value: 'packed', label: 'Packed' },
		{ value: 'shipped', label: 'Shipped' },
		{ value: 'delivered', label: 'Delivered' },
		{ value: 'returned', label: 'Returned' },
		{ value: 'cancelled', label: 'Cancelled' }
	];
</script>

<svelte:head><title>Orders · Admin</title></svelte:head>

<h1 class="text-2xl font-semibold tracking-tight text-ink">Orders</h1>
<p class="mt-1 text-sm text-ink-muted"><span class="num">{data.total}</span> orders</p>

<div class="mt-6 flex flex-wrap gap-2">
	{#each tabs as t (t.value)}
		<button
			class="rounded-xl border px-3 py-1.5 text-sm transition-colors duration-[180ms] ease-brand
			       {data.filters.status === t.value
				? 'border-primary bg-primary-soft font-medium text-primary'
				: 'border-border text-ink-muted hover:border-brand-300 hover:text-ink'}"
			onclick={() => apply({ status: t.value })}
		>
			{t.label}
			{#if t.value && data.counts[t.value]}
				<span class="num ml-1 text-ink-faint">{data.counts[t.value]}</span>
			{/if}
		</button>
	{/each}
</div>

<div class="relative mt-4 max-w-sm">
	<Input
		placeholder="Order number, phone or name"
		bind:value={q}
		oninput={(e) => search(e.currentTarget.value)}
		class="[&_input]:pl-9"
		aria-label="Search orders"
	/>
	<Search size={15} class="pointer-events-none absolute top-3.5 left-3 text-ink-faint" />
</div>

<div class="mt-4 overflow-hidden rounded-3xl border border-border bg-surface">
	<div class="overflow-x-auto">
		<table class="w-full text-sm">
			<thead>
				<tr class="border-b border-border text-left text-xs text-ink-muted">
					<th class="px-4 py-3 font-medium">Order</th>
					<th class="px-4 py-3 font-medium">Customer</th>
					<th class="px-4 py-3 font-medium">Status</th>
					<th class="px-4 py-3 font-medium">Payment</th>
					<th class="px-4 py-3 text-right font-medium">Total</th>
				</tr>
			</thead>
			<tbody>
				{#each data.rows as o (o.id)}
					<tr class="border-b border-border transition-colors last:border-0 hover:bg-surface-alt">
						<td class="px-4 py-3">
							<a href="/admin/orders/{o.id}" class="num font-medium text-primary">{o.number}</a>
							<span class="block text-xs text-ink-faint">
								{new Date(o.createdAt).toLocaleDateString('en-GB', {
									day: 'numeric',
									month: 'short'
								})}
							</span>
						</td>
						<td class="px-4 py-3">
							<span class="block text-ink">{o.name}</span>
							<span class="num block text-xs text-ink-faint">{formatPhone(o.phone)}</span>
						</td>
						<td class="px-4 py-3"><OrderStatus status={o.status} /></td>
						<td class="px-4 py-3 text-xs text-ink-muted">
							{o.paymentMethod === 'cod' ? 'COD' : 'Online'} · {o.paymentStatus}
						</td>
						<td class="num px-4 py-3 text-right font-medium text-ink">{formatTk(o.total)}</td>
					</tr>
				{:else}
					<tr>
						<td colspan="5" class="px-4 py-16 text-center text-ink-faint">
							<ShoppingCart size={22} class="mx-auto mb-3" />
							No orders here.
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
