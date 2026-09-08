<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { Printer, ArrowLeft } from '@lucide/svelte';
	import { formatTk } from '$lib/money';
	import { formatPhone } from '$lib/phone';
	import Button from '$lib/ui/Button.svelte';

	let { data } = $props();

	/* A print sheet is a snapshot — it must not re-render under the dialog. */
	const { order, items, settings, format } = untrack(() => data);

	const dated = new Date(order.createdAt).toLocaleDateString('en-GB', {
		day: 'numeric',
		month: 'short',
		year: 'numeric'
	});

	const zoneLabel = settings.delivery[order.zone]?.label ?? order.zone.replace(/_/g, ' ');
	const dueOnDelivery = order.paymentMethod === 'cod' && order.paymentStatus !== 'paid';

	/* Opening the tab straight from the order page should land in the print
	   dialog — that is the whole reason staff clicked. */
	onMount(() => {
		const t = setTimeout(() => window.print(), 400);
		return () => clearTimeout(t);
	});
</script>

<svelte:head>
	<title>{order.number} · {format === 'label' ? 'Label' : 'Invoice'}</title>
</svelte:head>

<!-- Screen-only toolbar; never printed. -->
<div
	class="no-print sticky top-0 flex items-center gap-3 border-b border-border bg-surface px-4 py-3"
>
	<a
		href="/admin/orders/{order.id}"
		class="flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
	>
		<ArrowLeft size={15} />
		Back to order
	</a>
	<div class="ml-auto flex gap-2">
		<Button
			size="sm"
			variant={format === 'invoice' ? 'primary' : 'secondary'}
			href="/admin/print/{order.id}?format=invoice"
		>
			A4 invoice
		</Button>
		<Button
			size="sm"
			variant={format === 'label' ? 'primary' : 'secondary'}
			href="/admin/print/{order.id}?format=label"
		>
			Courier label
		</Button>
		<Button size="sm" onclick={() => window.print()}>
			<Printer size={15} />
			Print
		</Button>
	</div>
</div>

{#if format === 'invoice'}
	<article class="sheet invoice mx-auto bg-white p-10 text-ink">
		<header class="flex items-start justify-between gap-6 border-b border-border pb-5">
			<div>
				<h1 class="text-xl font-semibold tracking-tight">{settings.store.name}</h1>
				{#if settings.store.phone}
					<p class="num mt-1 text-sm text-ink-muted">{settings.store.phone}</p>
				{/if}
				{#if settings.store.email}
					<p class="text-sm text-ink-muted">{settings.store.email}</p>
				{/if}
			</div>
			<div class="text-right">
				<p class="text-sm font-medium tracking-wide uppercase">Invoice</p>
				<p class="num mt-1 text-lg font-semibold">{order.number}</p>
				<p class="text-sm text-ink-muted">{dated}</p>
			</div>
		</header>

		<section class="grid grid-cols-2 gap-8 py-5">
			<div>
				<p class="text-xs font-medium tracking-wide text-ink-muted uppercase">Deliver to</p>
				<p class="mt-1.5 font-medium">{order.name}</p>
				<p class="num text-sm">{formatPhone(order.phone)}</p>
				<p class="mt-1 text-sm text-ink-muted">
					{order.address.line}{order.address.area ? `, ${order.address.area}` : ''}<br />
					{order.address.city} · {zoneLabel}
				</p>
			</div>
			<div>
				<p class="text-xs font-medium tracking-wide text-ink-muted uppercase">Payment</p>
				<p class="mt-1.5 text-sm">
					{order.paymentMethod === 'cod' ? 'Cash on delivery' : 'Paid online'}
					<span class="text-ink-muted">· {order.paymentStatus}</span>
				</p>
				{#if order.courier}
					<p class="mt-1 text-sm">
						{order.courier}
						{#if order.consignmentId}<span class="num"> · {order.consignmentId}</span>{/if}
					</p>
				{/if}
			</div>
		</section>

		<table class="w-full text-sm">
			<thead>
				<tr class="border-y border-border text-left">
					<th class="py-2 font-medium">Item</th>
					<th class="py-2 text-right font-medium">Price</th>
					<th class="py-2 text-right font-medium">Qty</th>
					<th class="py-2 text-right font-medium">Total</th>
				</tr>
			</thead>
			<tbody>
				{#each items as item (item.id)}
					<tr class="border-b border-border">
						<td class="py-2.5">
							{item.title}
							{#if item.optionLabel}
								<span class="block text-xs text-ink-muted">{item.optionLabel}</span>
							{/if}
						</td>
						<td class="num py-2.5 text-right">{formatTk(item.unitPrice)}</td>
						<td class="num py-2.5 text-right">{item.qty}</td>
						<td class="num py-2.5 text-right">{formatTk(item.unitPrice * item.qty)}</td>
					</tr>
				{/each}
			</tbody>
		</table>

		<div class="mt-5 ml-auto w-64 text-sm">
			<div class="flex justify-between py-1">
				<span class="text-ink-muted">Subtotal</span>
				<span class="num">{formatTk(order.subtotal)}</span>
			</div>
			<div class="flex justify-between py-1">
				<span class="text-ink-muted">Delivery</span>
				<span class="num">{formatTk(order.shipping)}</span>
			</div>
			{#if order.discount > 0}
				<div class="flex justify-between py-1">
					<span class="text-ink-muted">Discount {order.couponCode ?? ''}</span>
					<span class="num">−{formatTk(order.discount)}</span>
				</div>
			{/if}
			<div class="mt-1 flex justify-between border-t border-border pt-2 text-base font-semibold">
				<span>Total</span>
				<span class="num">{formatTk(order.total)}</span>
			</div>
			{#if dueOnDelivery}
				<div class="mt-1 flex justify-between rounded-lg bg-surface-alt px-2 py-1.5 font-medium">
					<span>Collect on delivery</span>
					<span class="num">{formatTk(order.total)}</span>
				</div>
			{/if}
		</div>

		{#if order.note}
			<p class="mt-6 border-t border-border pt-3 text-sm text-ink-muted">
				<span class="font-medium text-ink">Note:</span>
				{order.note}
			</p>
		{/if}

		<footer class="mt-8 border-t border-border pt-4 text-center text-xs text-ink-muted">
			Thank you for shopping with {settings.store.name}. Keep this invoice for returns and warranty
			claims.
		</footer>
	</article>
{:else}
	<!-- 80mm thermal label: only what the rider and the sorter actually read. -->
	<article class="sheet label mx-auto bg-white p-3 text-ink">
		<p class="text-center text-sm font-semibold">{settings.store.name}</p>
		{#if settings.store.phone}
			<p class="num text-center text-xs">{settings.store.phone}</p>
		{/if}

		<p class="num mt-2 border-y-2 border-ink py-1.5 text-center text-lg font-bold">
			{order.number}
		</p>

		<div class="mt-2 text-sm">
			<p class="font-semibold">{order.name}</p>
			<p class="num text-base font-bold">{formatPhone(order.phone)}</p>
			<p class="mt-0.5 leading-snug">
				{order.address.line}{order.address.area ? `, ${order.address.area}` : ''}<br />
				{order.address.city}
			</p>
			<p class="mt-0.5 text-xs font-medium uppercase">{zoneLabel}</p>
		</div>

		{#if order.courier}
			<p class="mt-2 border-t border-dashed border-ink pt-1.5 text-xs">
				{order.courier}
				{#if order.consignmentId}<span class="num"> · {order.consignmentId}</span>{/if}
			</p>
		{/if}

		<div class="mt-2 border-t-2 border-ink pt-2 text-center">
			{#if dueOnDelivery}
				<p class="text-xs font-medium uppercase">Collect cash</p>
				<p class="num text-2xl font-bold">{formatTk(order.total)}</p>
			{:else}
				<p class="text-xs font-medium uppercase">Paid — collect nothing</p>
				<p class="num text-lg font-bold">{formatTk(order.total)}</p>
			{/if}
		</div>

		<ul class="mt-2 border-t border-dashed border-ink pt-1.5 text-xs leading-snug">
			{#each items as item (item.id)}
				<li class="flex justify-between gap-2">
					<span class="min-w-0 truncate">{item.title}</span>
					<span class="num shrink-0">×{item.qty}</span>
				</li>
			{/each}
		</ul>

		{#if order.note}
			<p class="mt-2 border-t border-dashed border-ink pt-1.5 text-xs">{order.note}</p>
		{/if}
	</article>
{/if}

<style>
	/* On screen the sheet is previewed at its real paper width. */
	.sheet {
		box-sizing: border-box;
	}
	.invoice {
		width: 210mm;
		min-height: 297mm;
	}
	.label {
		width: 80mm;
	}

	@media print {
		:global(.no-print) {
			display: none !important;
		}
		:global(body) {
			background: #fff;
		}
		.invoice {
			width: auto;
			min-height: 0;
			padding: 0;
		}
		.label {
			width: auto;
			padding: 0;
		}
	}

	@page {
		margin: 12mm;
	}
</style>
