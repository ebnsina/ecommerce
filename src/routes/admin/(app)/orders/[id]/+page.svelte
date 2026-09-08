<script lang="ts">
	import { enhance } from '$app/forms';
	import { ArrowLeft, Phone, MapPin, Truck, Printer, Tag } from '@lucide/svelte';
	import { formatTk } from '$lib/money';
	import { formatPhone } from '$lib/phone';
	import OrderStatus from '$lib/shop/OrderStatus.svelte';
	import Button from '$lib/ui/Button.svelte';
	import Input from '$lib/ui/Input.svelte';

	let { data, form } = $props();

	const labels: Record<string, string> = {
		confirmed: 'Mark confirmed',
		packed: 'Mark packed',
		shipped: 'Mark shipped',
		delivered: 'Mark delivered',
		returned: 'Mark returned (RTO)',
		cancelled: 'Cancel order'
	};
</script>

<svelte:head><title>Order {data.order.number} · Admin</title></svelte:head>

<a
	href="/admin/orders"
	class="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
>
	<ArrowLeft size={15} />
	All orders
</a>

<div class="mt-3 flex flex-wrap items-start justify-between gap-4">
	<div>
		<h1 class="num text-2xl font-semibold tracking-tight text-ink">{data.order.number}</h1>
		<p class="mt-1 flex items-center gap-2 text-sm text-ink-muted">
			<OrderStatus status={data.order.status} />
			{new Date(data.order.createdAt).toLocaleString('en-GB', {
				day: 'numeric',
				month: 'short',
				year: 'numeric',
				hour: '2-digit',
				minute: '2-digit'
			})}
		</p>
	</div>
	<div class="flex gap-2">
		<Button variant="secondary" href="/admin/print/{data.order.id}?format=invoice" target="_blank">
			<Printer size={16} />
			Invoice
		</Button>
		<Button variant="secondary" href="/admin/print/{data.order.id}?format=label" target="_blank">
			<Tag size={16} />
			Courier label
		</Button>
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

{#if data.next.length}
	<section class="mt-6 rounded-3xl border border-border bg-surface p-5">
		<h2 class="text-sm font-medium text-ink">Next step</h2>
		{#if data.order.status === 'pending'}
			<p class="mt-1 text-sm text-ink-muted">
				Call <a href="tel:{data.order.phone}" class="num text-primary"
					>{formatPhone(data.order.phone)}</a
				>
				to confirm before dispatch. Confirming reserves stock.
			</p>
		{/if}
		<div class="mt-4 flex flex-wrap gap-2">
			{#each data.next as to (to)}
				<form method="POST" action="?/transition" use:enhance>
					<input type="hidden" name="to" value={to} />
					<Button variant={to === 'cancelled' ? 'danger' : 'primary'} size="sm" type="submit">
						{labels[to] ?? to}
					</Button>
				</form>
			{/each}
		</div>
	</section>
{/if}

<div class="mt-4 grid gap-4 lg:grid-cols-3">
	<section class="rounded-3xl border border-border bg-surface lg:col-span-2">
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
					{#if item.optionLabel}<span class="block text-xs text-ink-muted">{item.optionLabel}</span
						>{/if}
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
				<dd class="num">{formatTk(data.order.subtotal)}</dd>
			</div>
			<div class="flex justify-between">
				<dt class="text-ink-muted">Delivery</dt>
				<dd class="num">{formatTk(data.order.shipping)}</dd>
			</div>
			{#if data.order.discount > 0}
				<div class="flex justify-between">
					<dt class="text-ink-muted">Discount {data.order.couponCode ?? ''}</dt>
					<dd class="num text-success">−{formatTk(data.order.discount)}</dd>
				</div>
			{/if}
			<div class="mt-1 flex justify-between border-t border-border pt-3">
				<dt class="font-medium text-ink">
					Total · {data.order.paymentMethod === 'cod' ? 'cash on delivery' : 'paid online'}
				</dt>
				<dd class="num text-lg font-semibold text-ink">{formatTk(data.order.total)}</dd>
			</div>
		</dl>
	</section>

	<div class="flex flex-col gap-4">
		<section class="rounded-3xl border border-border bg-surface p-5">
			<h2 class="flex items-center gap-2 text-sm font-medium text-ink">
				<Phone size={15} class="text-primary" />
				Customer
			</h2>
			<p class="mt-2 text-sm text-ink">{data.order.name}</p>
			<a href="tel:{data.order.phone}" class="num text-sm text-primary">
				{formatPhone(data.order.phone)}
			</a>
			<h3 class="mt-4 flex items-center gap-2 text-sm font-medium text-ink">
				<MapPin size={15} class="text-primary" />
				Delivery address
			</h3>
			<p class="mt-1 text-sm text-ink-muted">
				{data.order.address.line}{data.order.address.area ? `, ${data.order.address.area}` : ''}<br
				/>
				{data.order.address.city}
			</p>
			{#if data.order.note}
				<p class="mt-4 border-t border-border pt-3 text-sm text-ink-muted">
					<span class="font-medium text-ink">Note:</span>
					{data.order.note}
				</p>
			{/if}
		</section>

		<section class="rounded-3xl border border-border bg-surface p-5">
			<h2 class="flex items-center gap-2 text-sm font-medium text-ink">
				<Truck size={15} class="text-primary" />
				Courier
			</h2>

			{#if data.order.consignmentId}
				<dl class="mt-3 flex flex-col gap-1.5 text-sm">
					<div class="flex justify-between gap-3">
						<dt class="text-ink-muted">Courier</dt>
						<dd class="text-ink">{data.order.courier}</dd>
					</div>
					<div class="flex justify-between gap-3">
						<dt class="text-ink-muted">Consignment</dt>
						<dd class="num text-ink">{data.order.consignmentId}</dd>
					</div>
					{#if data.order.trackingCode}
						<div class="flex justify-between gap-3">
							<dt class="text-ink-muted">Tracking</dt>
							<dd class="num text-ink">{data.order.trackingCode}</dd>
						</div>
					{/if}
					{#if data.order.courierStatus}
						<div class="flex justify-between gap-3">
							<dt class="text-ink-muted">Their status</dt>
							<dd class="text-ink capitalize">{data.order.courierStatus.replace(/_/g, ' ')}</dd>
						</div>
					{/if}
				</dl>

				{#if data.order.courierSyncedAt}
					<p class="mt-2 text-xs text-ink-faint">
						Checked {new Date(data.order.courierSyncedAt).toLocaleString('en-GB', {
							day: 'numeric',
							month: 'short',
							hour: '2-digit',
							minute: '2-digit'
						})}
					</p>
				{/if}
			{:else}
				<p class="mt-1 text-xs text-ink-muted">
					Sending the parcel marks the order shipped and texts the customer.
				</p>

				<div class="mt-3 flex flex-col gap-2">
					{#each data.couriers as c (c.key)}
						<form method="POST" action="?/dispatch" use:enhance>
							<input type="hidden" name="courier" value={c.key} />
							<Button size="sm" block type="submit" disabled={!c.configured}>
								<Truck size={15} />
								Send with {c.label}
							</Button>
							{#if !c.configured}
								<p class="mt-1 text-xs text-ink-faint">
									{c.label} is not connected —
									<a href="/admin/connections" class="underline">see what it needs</a>.
								</p>
							{/if}
						</form>
					{/each}
				</div>

				<details class="mt-4">
					<summary class="cursor-pointer text-xs text-ink-muted">Enter details by hand</summary>
					<form method="POST" action="?/courier" use:enhance class="mt-3 flex flex-col gap-3">
						<Input
							name="courier"
							label="Courier"
							value={data.order.courier ?? ''}
							placeholder="Steadfast"
						/>
						<Input
							name="consignmentId"
							label="Consignment ID"
							value={data.order.consignmentId ?? ''}
							numeric
						/>
						<Button size="sm" variant="secondary" type="submit">Save</Button>
					</form>
				</details>
			{/if}
		</section>

		<section class="rounded-3xl border border-border bg-surface p-5">
			<h2 class="text-sm font-medium text-ink">History</h2>
			<ol class="mt-3 flex flex-col gap-3">
				{#each data.events as e (e.id)}
					<li class="flex gap-3">
						<span class="mt-1.5 size-2 shrink-0 rounded-full bg-brand-200"></span>
						<span class="min-w-0">
							<span class="block text-sm text-ink capitalize">{e.toStatus}</span>
							{#if e.note}<span class="block text-xs text-ink-muted">{e.note}</span>{/if}
							<span class="block text-xs text-ink-faint">
								{new Date(e.createdAt).toLocaleString('en-GB', {
									day: 'numeric',
									month: 'short',
									hour: '2-digit',
									minute: '2-digit'
								})}{e.actor ? ` · ${e.actor}` : ''}
							</span>
						</span>
					</li>
				{/each}
			</ol>
		</section>
	</div>
</div>
