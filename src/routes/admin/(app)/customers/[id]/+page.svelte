<script lang="ts">
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import { ArrowLeft, Phone, MapPin, TriangleAlert } from '@lucide/svelte';
	import { formatTk } from '$lib/money';
	import { formatPhone } from '$lib/phone';
	import OrderStatus from '$lib/shop/OrderStatus.svelte';
	import Button from '$lib/ui/Button.svelte';
	import Input from '$lib/ui/Input.svelte';
	import Textarea from '$lib/ui/Textarea.svelte';

	let { data } = $props();
	const init = untrack(() => data.customer);

	let name = $state(init.name ?? '');
	let email = $state(init.email ?? '');
	let notes = $state(init.notes ?? '');
	let tags = $state((init.tags ?? []).join(', '));

	/** The COD signal that matters here: how often this number actually accepts. */
	const finished = $derived(data.stats.delivered + data.stats.returned + data.stats.cancelled);
	const successRate = $derived(
		finished > 0 ? Math.round((data.stats.delivered / finished) * 100) : null
	);
	const risky = $derived(successRate !== null && finished >= 3 && successRate < 50);
</script>

<svelte:head
	><title>{name || formatPhone(data.customer.phone)} · Customers · Admin</title></svelte:head
>

<a
	href="/admin/customers"
	class="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
>
	<ArrowLeft size={15} />
	All customers
</a>

<div class="mt-3 flex flex-wrap items-start justify-between gap-4">
	<div>
		<h1 class="text-2xl font-semibold tracking-tight text-ink">{name || 'Unnamed customer'}</h1>
		<a
			href="tel:{data.customer.phone}"
			class="num mt-1 flex items-center gap-1.5 text-sm text-primary"
		>
			<Phone size={14} />
			{formatPhone(data.customer.phone)}
		</a>
	</div>
</div>

{#if risky}
	<p
		class="mt-4 flex items-start gap-2.5 rounded-2xl border border-star/40 bg-star/10 px-4 py-3 text-sm text-ink"
	>
		<TriangleAlert size={17} class="mt-0.5 shrink-0 text-star" />
		Only <span class="num font-semibold">{successRate}%</span> of this number's finished orders were
		accepted (<span class="num">{data.stats.returned}</span> returned,
		<span class="num">{data.stats.cancelled}</span> cancelled). Consider asking for advance payment before
		dispatching COD.
	</p>
{/if}

<div class="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
	{#each [{ label: 'Orders', value: String(data.stats.total) }, { label: 'Delivered', value: String(data.stats.delivered) }, { label: 'Returned / cancelled', value: `${data.stats.returned + data.stats.cancelled}` }, { label: 'Lifetime value', value: formatTk(data.stats.spent) }] as s (s.label)}
		<div class="rounded-3xl border border-border bg-surface p-5">
			<p class="text-sm text-ink-muted">{s.label}</p>
			<p class="num mt-1 text-2xl font-semibold text-ink">{s.value}</p>
		</div>
	{/each}
</div>

<div class="mt-4 grid gap-4 lg:grid-cols-3">
	<section class="rounded-3xl border border-border bg-surface lg:col-span-2">
		<div class="border-b border-border px-5 py-4">
			<h2 class="text-sm font-medium text-ink">Order history</h2>
		</div>
		{#each data.history as o (o.id)}
			<a
				href="/admin/orders/{o.id}"
				class="flex flex-wrap items-center gap-4 border-b border-border px-5 py-3 transition-colors last:border-0 hover:bg-surface-alt"
			>
				<span class="min-w-28">
					<span class="num block text-sm font-medium text-primary">{o.number}</span>
					<span class="block text-xs text-ink-faint">
						{new Date(o.createdAt).toLocaleDateString('en-GB', {
							day: 'numeric',
							month: 'short',
							year: 'numeric'
						})}
					</span>
				</span>
				<OrderStatus status={o.status} />
				<span class="num ml-auto text-sm font-medium text-ink">{formatTk(o.total)}</span>
			</a>
		{:else}
			<p class="px-5 py-12 text-center text-sm text-ink-faint">No orders yet.</p>
		{/each}
	</section>

	<div class="flex flex-col gap-4">
		<form
			method="POST"
			action="?/save"
			use:enhance
			class="rounded-3xl border border-border bg-surface p-5"
		>
			<h2 class="mb-4 text-sm font-medium text-ink">Details</h2>
			<div class="flex flex-col gap-4">
				<Input label="Name" name="name" bind:value={name} />
				<Input label="Email" name="email" type="email" bind:value={email} />
				<Input
					label="Tags"
					name="tags"
					bind:value={tags}
					hint="Comma separated, e.g. wholesale, vip"
				/>
				<Textarea
					label="Internal notes"
					name="notes"
					bind:value={notes}
					rows={4}
					hint="Never shown to the customer."
				/>
				<Button size="sm" type="submit" class="self-start">Save</Button>
			</div>
		</form>

		<section class="rounded-3xl border border-border bg-surface p-5">
			<h2 class="flex items-center gap-2 text-sm font-medium text-ink">
				<MapPin size={15} class="text-primary" />
				Addresses
			</h2>
			{#each data.addresses as a (a.id)}
				<p class="mt-3 text-sm text-ink-muted">
					<span class="font-medium text-ink">{a.name}</span>
					<span class="num"> · {formatPhone(a.phone)}</span><br />
					{a.line}{a.area ? `, ${a.area}` : ''}, {a.city}
				</p>
			{:else}
				<p class="mt-3 text-sm text-ink-faint">None saved.</p>
			{/each}
		</section>
	</div>
</div>
