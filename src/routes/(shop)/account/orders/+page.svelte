<script lang="ts">
	import { Package } from '@lucide/svelte';
	import { formatTk } from '$lib/money';
	import OrderStatus from '$lib/shop/OrderStatus.svelte';
	import Button from '$lib/ui/Button.svelte';

	let { data } = $props();
</script>

<svelte:head><title>My orders · {data.settings.store.name}</title></svelte:head>

<h1 class="text-2xl font-semibold tracking-tight text-ink">My orders</h1>

<div class="mt-6 overflow-hidden rounded-3xl border border-border bg-surface">
	{#each data.list as o (o.id)}
		<a
			href="/order/{o.number}"
			class="flex flex-wrap items-center gap-4 border-b border-border px-5 py-4 transition-colors last:border-0 hover:bg-surface-alt"
		>
			<span class="min-w-32">
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
			<span class="text-xs text-ink-muted capitalize">
				{o.paymentMethod === 'cod' ? 'Cash on delivery' : 'Paid online'}
			</span>
			<span class="num ml-auto text-sm font-semibold text-ink">{formatTk(o.total)}</span>
		</a>
	{:else}
		<div class="flex flex-col items-center gap-4 px-6 py-20">
			<Package size={26} class="text-ink-faint" />
			<p class="text-sm text-ink-muted">You have not ordered anything yet.</p>
			<Button href="/search">Start shopping</Button>
		</div>
	{/each}
</div>
