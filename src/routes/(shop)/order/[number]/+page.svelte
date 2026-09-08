<script lang="ts">
	import { CircleCheck, Phone, Truck } from '@lucide/svelte';
	import { formatTk } from '$lib/money';
	import { formatPhone } from '$lib/phone';
	import OrderStatus from '$lib/shop/OrderStatus.svelte';
	import Button from '$lib/ui/Button.svelte';

	let { data } = $props();
</script>

<svelte:head><title>Order {data.order.number} · {data.settings.store.name}</title></svelte:head>

<div class="mx-auto max-w-2xl px-4 py-12">
	<div class="flex flex-col items-center text-center">
		<span class="grid size-14 place-items-center rounded-2xl bg-success/10 text-success">
			<CircleCheck size={26} />
		</span>
		<h1 class="mt-4 text-2xl font-semibold tracking-tight text-ink">Order placed</h1>
		<p class="mt-1 text-sm text-ink-muted">
			Order <span class="num font-medium text-ink">{data.order.number}</span> ·
			<OrderStatus status={data.order.status} />
		</p>
	</div>

	<div class="mt-6 flex items-start gap-3 rounded-3xl border border-border bg-primary-soft p-4">
		<Phone size={18} class="mt-0.5 shrink-0 text-primary" />
		<p class="text-sm text-ink">
			We will call <span class="num font-medium">{formatPhone(data.order.phone)}</span> to confirm this
			order before it is dispatched. Please keep your phone reachable.
		</p>
	</div>

	<section class="mt-4 rounded-3xl border border-border bg-surface">
		<div class="border-b border-border px-5 py-4">
			<h2 class="text-sm font-medium text-ink">Items</h2>
		</div>
		{#each data.items as item (item.id)}
			<div class="flex items-center gap-3 border-b border-border px-5 py-3 last:border-0">
				<span class="size-12 shrink-0 overflow-hidden rounded-xl bg-surface-alt">
					{#if item.image}<img src={item.image} alt="" class="size-full object-cover" />{/if}
				</span>
				<span class="min-w-0 flex-1">
					<span class="block truncate text-sm text-ink">{item.title}</span>
					{#if item.optionLabel}
						<span class="block text-xs text-ink-muted">{item.optionLabel}</span>
					{/if}
					<span class="num block text-xs text-ink-muted"
						>{item.qty} × {formatTk(item.unitPrice)}</span
					>
				</span>
				<span class="num text-sm font-medium text-ink">{formatTk(item.unitPrice * item.qty)}</span>
			</div>
		{/each}

		<dl class="flex flex-col gap-2 px-5 py-4 text-sm">
			<div class="flex justify-between">
				<dt class="text-ink-muted">Subtotal</dt>
				<dd class="num text-ink">{formatTk(data.order.subtotal)}</dd>
			</div>
			<div class="flex justify-between">
				<dt class="text-ink-muted">Delivery</dt>
				<dd class="num text-ink">
					{data.order.shipping === 0 ? 'Free' : formatTk(data.order.shipping)}
				</dd>
			</div>
			{#if data.order.discount > 0}
				<div class="flex justify-between">
					<dt class="text-ink-muted">Discount {data.order.couponCode ?? ''}</dt>
					<dd class="num text-success">−{formatTk(data.order.discount)}</dd>
				</div>
			{/if}
			<div class="mt-1 flex justify-between border-t border-border pt-3">
				<dt class="font-medium text-ink">
					Total {data.order.paymentMethod === 'cod' ? '(cash on delivery)' : ''}
				</dt>
				<dd class="num text-lg font-semibold text-ink">{formatTk(data.order.total)}</dd>
			</div>
		</dl>
	</section>

	<section class="mt-4 rounded-3xl border border-border bg-surface p-5">
		<h2 class="flex items-center gap-2 text-sm font-medium text-ink">
			<Truck size={16} class="text-primary" />
			Delivering to
		</h2>
		<p class="mt-2 text-sm text-ink-muted">
			{data.order.name}<br />
			{data.order.address.line}{data.order.address.area ? `, ${data.order.address.area}` : ''}<br />
			{data.order.address.city}
		</p>
	</section>

	<div class="mt-6 flex justify-center gap-3">
		<Button href="/" variant="secondary">Continue shopping</Button>
		<Button href="/account/orders">My orders</Button>
	</div>
</div>
