<script lang="ts">
	import { onMount } from 'svelte';
	import { BanknoteIcon, ShoppingCart, Clock, Users, TriangleAlert } from '@lucide/svelte';
	import { formatTk } from '$lib/money';
	import StatCard from '$lib/ui/StatCard.svelte';
	import LineChart from '$lib/charts/LineChart.svelte';
	import BarChart from '$lib/charts/BarChart.svelte';

	let { data } = $props();

	/* Live clock — starts from the server render, then ticks on the client. */
	let now = $state(new Date());
	onMount(() => {
		const t = setInterval(() => (now = new Date()), 30_000);
		return () => clearInterval(t);
	});

	const greeting = $derived(
		now.getHours() < 5
			? 'Still up'
			: now.getHours() < 12
				? 'Good morning'
				: now.getHours() < 17
					? 'Good afternoon'
					: 'Good evening'
	);

	const dateLabel = $derived(
		now.toLocaleDateString('en-GB', {
			weekday: 'long',
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		})
	);
	const timeLabel = $derived(
		now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
	);

	const statusTone: Record<string, string> = {
		pending: 'var(--color-brand-300)',
		confirmed: 'var(--color-brand-500)',
		packed: 'var(--color-brand-600)',
		shipped: 'var(--color-brand-700)',
		delivered: 'var(--color-success)',
		returned: 'var(--color-star)',
		cancelled: 'var(--color-sale)'
	};

	const statusBars = $derived(
		data.byStatus.map((s) => ({ ...s, hue: statusTone[s.label] ?? 'var(--color-primary)' }))
	);

	const ordersSeries = $derived(data.series.map((d) => ({ label: d.label, value: d.orders })));
	const hasOrders = $derived(data.series.some((d) => d.orders > 0));
</script>

<svelte:head><title>Dashboard · Admin</title></svelte:head>

<!-- Salutation left, date/time right -->
<div class="flex flex-wrap items-start justify-between gap-4">
	<div>
		<h1 class="text-2xl font-semibold tracking-tight text-ink">
			{greeting}, {data.admin?.name?.split(' ')[0]}
		</h1>
		<p class="mt-1 text-sm text-ink-muted">Here is how the store is doing.</p>
	</div>
	<div class="text-right">
		<p class="text-sm font-medium text-ink">{dateLabel}</p>
		<p class="num text-sm text-ink-muted">{timeLabel}</p>
	</div>
</div>

<!-- Stats -->
<div class="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
	<StatCard label="Revenue" value={formatTk(data.stats.revenue)} note="Excludes cancelled orders">
		{#snippet icon()}<BanknoteIcon size={18} />{/snippet}
	</StatCard>
	<StatCard label="Orders" value={String(data.stats.orders)} note="All time">
		{#snippet icon()}<ShoppingCart size={18} />{/snippet}
	</StatCard>
	<StatCard
		label="Awaiting confirmation"
		value={String(data.stats.pending)}
		note="Call the customer to confirm"
		tone={data.stats.pending > 0 ? 'warn' : 'default'}
	>
		{#snippet icon()}<Clock size={18} />{/snippet}
	</StatCard>
	<StatCard label="Customers" value={String(data.stats.customers)}>
		{#snippet icon()}<Users size={18} />{/snippet}
	</StatCard>
</div>

{#if data.stats.lowStock > 0}
	<div
		class="mt-4 flex items-center gap-3 rounded-3xl border border-border bg-surface p-4"
		role="status"
	>
		<TriangleAlert size={18} class="shrink-0 text-star" />
		<p class="text-sm text-ink">
			<span class="num font-semibold">{data.stats.lowStock}</span> active
			{data.stats.lowStock === 1 ? 'product is' : 'products are'} down to 5 units or fewer.
		</p>
		<a href="/admin/products?filter=low-stock" class="ml-auto text-sm font-medium text-primary">
			Review
		</a>
	</div>
{/if}

<!-- Charts -->
<div class="mt-6 grid gap-4 lg:grid-cols-3">
	<section class="rounded-3xl border border-border bg-surface p-5 lg:col-span-2">
		<h2 class="text-sm font-medium text-ink">Orders · last 14 days</h2>
		<p class="mt-0.5 mb-4 text-xs text-ink-muted">One point per day, quiet days included.</p>
		{#if hasOrders}
			<LineChart data={ordersSeries} height={220} />
		{:else}
			<p class="py-16 text-center text-sm text-ink-faint">No orders in this window yet.</p>
		{/if}
	</section>

	<section class="rounded-3xl border border-border bg-surface p-5">
		<h2 class="text-sm font-medium text-ink">Orders by status</h2>
		<p class="mt-0.5 mb-4 text-xs text-ink-muted">Where every order currently sits.</p>
		{#if statusBars.length}
			<BarChart data={statusBars} />
		{:else}
			<p class="py-16 text-center text-sm text-ink-faint">Nothing to show yet.</p>
		{/if}
	</section>
</div>

<!-- Recent orders -->
<section class="mt-4 rounded-3xl border border-border bg-surface">
	<div class="flex items-center justify-between border-b border-border px-5 py-4">
		<h2 class="text-sm font-medium text-ink">Recent orders</h2>
		<a href="/admin/orders" class="text-sm font-medium text-primary">All orders</a>
	</div>

	{#if data.recent.length}
		<div class="overflow-x-auto">
			<table class="w-full text-sm">
				<thead>
					<tr class="border-b border-border text-left text-xs text-ink-muted">
						<th class="px-5 py-2.5 font-medium">Order</th>
						<th class="px-5 py-2.5 font-medium">Customer</th>
						<th class="px-5 py-2.5 font-medium">Status</th>
						<th class="px-5 py-2.5 text-right font-medium">Total</th>
					</tr>
				</thead>
				<tbody>
					{#each data.recent as o (o.id)}
						<tr class="border-b border-border transition-colors last:border-0 hover:bg-surface-alt">
							<td class="px-5 py-3">
								<a href="/admin/orders/{o.id}" class="num font-medium text-primary">{o.number}</a>
							</td>
							<td class="px-5 py-3 text-ink">{o.name}</td>
							<td class="px-5 py-3">
								<span
									class="inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-xs capitalize"
									style="background:color-mix(in oklab, {statusTone[o.status]} 12%, transparent);
									       color:{statusTone[o.status]}"
								>
									{o.status}
								</span>
							</td>
							<td class="num px-5 py-3 text-right font-medium text-ink">{formatTk(o.total)}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{:else}
		<p class="px-5 py-12 text-center text-sm text-ink-faint">No orders yet.</p>
	{/if}
</section>
