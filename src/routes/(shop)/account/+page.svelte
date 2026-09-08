<script lang="ts">
	import { formatTk } from '$lib/money';
	import OrderStatus from '$lib/shop/OrderStatus.svelte';

	let { data } = $props();
</script>

<svelte:head><title>My account · {data.settings.store.name}</title></svelte:head>

<h1 class="text-2xl font-semibold tracking-tight text-ink">
	Hello{data.me.name ? `, ${data.me.name}` : ''}
</h1>

<div class="mt-6 grid gap-4 sm:grid-cols-3">
	{#each [{ label: 'Orders', value: data.recent.length, href: '/account/orders' }, { label: 'Wishlist', value: data.wishlistCount, href: '/account/wishlist' }, { label: 'Addresses', value: data.addressCount, href: '/account/addresses' }] as s (s.label)}
		<a
			href={s.href}
			class="rounded-3xl border border-border bg-surface p-5 transition-colors hover:border-brand-300"
		>
			<p class="text-sm text-ink-muted">{s.label}</p>
			<p class="num mt-1 text-2xl font-semibold text-ink">{s.value}</p>
		</a>
	{/each}
</div>

<section class="mt-4 rounded-3xl border border-border bg-surface">
	<div class="flex items-center justify-between border-b border-border px-5 py-4">
		<h2 class="text-sm font-medium text-ink">Recent orders</h2>
		<a href="/account/orders" class="text-sm text-primary">All orders</a>
	</div>
	{#if data.recent.length}
		{#each data.recent as o (o.id)}
			<a
				href="/account/orders/{o.id}"
				class="flex items-center justify-between gap-4 border-b border-border px-5 py-4 transition-colors last:border-0 hover:bg-surface-alt"
			>
				<span>
					<span class="num block text-sm font-medium text-ink">{o.number}</span>
					<span class="block text-xs text-ink-faint">
						{new Date(o.createdAt).toLocaleDateString('en-GB', {
							day: 'numeric',
							month: 'short',
							year: 'numeric'
						})}
					</span>
				</span>
				<OrderStatus status={o.status} />
				<span class="num text-sm font-semibold text-ink">{formatTk(o.total)}</span>
			</a>
		{/each}
	{:else}
		<p class="px-5 py-12 text-center text-sm text-ink-faint">No orders yet.</p>
	{/if}
</section>
