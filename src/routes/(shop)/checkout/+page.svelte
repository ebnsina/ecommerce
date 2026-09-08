<script lang="ts">
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import { fade, fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import {
		Truck,
		Banknote,
		CreditCard,
		Tag,
		Check,
		ArrowLeft,
		ArrowRight,
		MapPin,
		Wallet,
		ClipboardCheck
	} from '@lucide/svelte';
	import { formatTk } from '$lib/money';
	import { track } from '$lib/track';
	import { formatPhone, normalizePhone } from '$lib/phone';
	import { fadeIn, DUR_SLOW, reduced } from '$lib/motion';
	import Button from '$lib/ui/Button.svelte';
	import Input from '$lib/ui/Input.svelte';
	import Textarea from '$lib/ui/Textarea.svelte';
	import Select from '$lib/ui/Select.svelte';

	let { data, form } = $props();

	// Reaching this page is the "InitiateCheckout" signal Meta optimises against.
	$effect(() => {
		track('InitiateCheckout', {
			currency: 'BDT',
			value: data.subtotal / 100,
			num_items: data.lines.reduce((n, l) => n + l.qty, 0)
		});
	});

	/* Prefills only — the form owns these once rendered. */
	const init = untrack(() => data);
	const first = init.addresses[0];

	let name = $state(first?.name ?? init.name);
	let phone = $state(first?.phone ?? init.phone);
	let districtId = $state(first?.districtId ?? '');
	let areaId = $state(first?.areaId ?? '');
	let line = $state(first?.line ?? '');
	let note = $state('');
	let paymentMethod = $state('cod');
	let couponInput = $state('');
	let submitting = $state(false);

	function useAddress(a: (typeof data.addresses)[number]) {
		name = a.name;
		phone = a.phone;
		districtId = a.districtId ?? '';
		areaId = a.areaId ?? '';
		line = a.line;
	}

	/* Areas depend on the district; changing district clears a stale area. */
	const areas = $derived(data.regions.areasByDistrict[districtId] ?? []);

	function pickDistrict(id: string) {
		districtId = id;
		areaId = '';
	}

	/* The area's zone wins over the district's — Savar sits in Dhaka district but
	   is not inside-Dhaka delivery. The server re-resolves this on submit. */
	const zone = $derived(
		areas.find((a) => a.id === areaId)?.zone ??
			data.regions.districts.find((d) => d.id === districtId)?.zone ??
			''
	);

	const zoneInfo = $derived(zone ? data.zones.find((z) => z.value === zone) : undefined);
	const shipping = $derived(
		zoneInfo && zoneInfo.freeAbove > 0 && data.subtotal >= zoneInfo.freeAbove
			? 0
			: (zoneInfo?.charge ?? 0)
	);
	const coupon = $derived(form?.coupon ?? null);
	const discount = $derived(coupon?.discount ?? 0);
	const total = $derived(Math.max(0, data.subtotal + shipping - discount));

	const districtName = $derived(
		data.regions.districts.find((d) => d.id === districtId)?.name ?? ''
	);
	const areaName = $derived(areas.find((a) => a.id === areaId)?.name ?? '');

	/* ── steps ───────────────────────────────────────────────────────── */

	const steps = [
		{ key: 'address', label: 'Delivery', Icon: MapPin },
		{ key: 'payment', label: 'Payment', Icon: Wallet },
		{ key: 'review', label: 'Review', Icon: ClipboardCheck }
	];

	let step = $state(0);
	let dir = $state(1);
	let touched = $state(false);

	/* Step 1 is the only one that can be wrong; the server re-validates all of it. */
	const addressErrors = $derived({
		name: name.trim() ? '' : 'Enter the name for delivery.',
		phone: normalizePhone(phone) ? '' : 'Enter a valid Bangladeshi mobile number.',
		district: districtId ? '' : 'Choose your district.',
		line: line.trim() ? '' : 'Enter the full delivery address.'
	});
	const addressValid = $derived(Object.values(addressErrors).every((e) => !e));

	/** Leaving the contact step with a good number is what makes this cart
	    recoverable if the shopper never comes back. Fire-and-forget. */
	function remember() {
		const body = new FormData();
		body.set('phone', phone);
		body.set('name', name);
		fetch('?/identify', { method: 'POST', body }).catch(() => {});
	}

	function next() {
		if (step === 0 && !addressValid) {
			touched = true;
			return;
		}
		if (step === 0) remember();
		touched = false;
		dir = 1;
		step = Math.min(steps.length - 1, step + 1);
	}

	function back() {
		dir = -1;
		step = Math.max(0, step - 1);
	}

	/** Completed steps are clickable; ones ahead are not. */
	function goto(i: number) {
		if (i > step && !addressValid) return;
		dir = i > step ? 1 : -1;
		step = i;
	}

	const enter = $derived({
		x: reduced() ? 0 : dir * 28,
		duration: reduced() ? 0 : DUR_SLOW,
		easing: cubicOut
	});
</script>

<svelte:head><title>Checkout · {data.settings.store.name}</title></svelte:head>

<div class="mx-auto max-w-7xl px-4 py-8">
	<h1 class="text-2xl font-semibold tracking-tight text-ink">Checkout</h1>

	<!-- Stepper. The connector fills as you advance, so progress is legible
	     without reading the labels. -->
	<ol class="mt-6 flex items-center gap-2">
		{#each steps as s, i (s.key)}
			<li class="flex flex-1 items-center gap-2 last:flex-none">
				<button
					type="button"
					onclick={() => goto(i)}
					disabled={i > step && !addressValid}
					class="flex shrink-0 items-center gap-2.5 rounded-xl px-1 py-1 text-left
					       disabled:cursor-not-allowed"
					aria-current={i === step ? 'step' : undefined}
				>
					<span
						class="grid size-9 shrink-0 place-items-center rounded-full text-sm font-semibold
						       transition-colors duration-[280ms] ease-brand
						       {i < step
							? 'bg-success text-white'
							: i === step
								? 'bg-primary text-white'
								: 'bg-surface-alt text-ink-faint'}"
					>
						{#if i < step}
							<Check size={16} />
						{:else}
							<s.Icon size={16} />
						{/if}
					</span>
					<span
						class="hidden text-sm font-medium sm:block
						       {i <= step ? 'text-ink' : 'text-ink-faint'}"
					>
						{s.label}
					</span>
				</button>

				{#if i < steps.length - 1}
					<span class="h-0.5 flex-1 overflow-hidden rounded-full bg-surface-alt">
						<span
							class="block h-full rounded-full bg-success transition-[width] duration-[280ms] ease-brand"
							style="width: {i < step ? '100%' : '0%'}"
						></span>
					</span>
				{/if}
			</li>
		{/each}
	</ol>

	{#if form?.error}
		<p
			class="mt-4 rounded-2xl border border-sale/30 bg-sale/8 px-4 py-3 text-sm text-sale"
			role="alert"
		>
			{form.error}
		</p>
	{/if}

	<div class="mt-6 grid gap-6 lg:grid-cols-[1fr_22rem]">
		<form
			id="checkout"
			method="POST"
			action="?/place"
			use:enhance={() => {
				submitting = true;
				return async ({ update }) => {
					submitting = false;
					await update({ reset: false });
				};
			}}
			class="flex flex-col gap-4"
		>
			<!-- Every value posts from here, so a field on a hidden step is never
			     dropped. The visible inputs below carry no name attribute. -->
			<input type="hidden" name="name" value={name} />
			<input type="hidden" name="phone" value={phone} />
			<input type="hidden" name="districtId" value={districtId} />
			<input type="hidden" name="areaId" value={areaId} />
			<input type="hidden" name="line" value={line} />
			<input type="hidden" name="note" value={note} />
			<input type="hidden" name="paymentMethod" value={paymentMethod} />
			<input type="hidden" name="couponCode" value={coupon?.code ?? ''} />

			{#key step}
				<div in:fly={enter}>
					{#if step === 0}
						{#if data.addresses.length}
							<section class="rounded-3xl border border-border bg-surface p-5">
								<h2 class="mb-3 text-sm font-medium text-ink">Saved addresses</h2>
								<div class="flex flex-wrap gap-2">
									{#each data.addresses as a (a.id)}
										<button
											type="button"
											class="max-w-72 rounded-2xl border border-border p-3 text-left transition-colors
											       hover:border-brand-300"
											onclick={() => useAddress(a)}
										>
											<span class="block text-sm font-medium text-ink">{a.name}</span>
											<span class="block truncate text-xs text-ink-muted">{a.line}, {a.city}</span>
										</button>
									{/each}
								</div>
							</section>
						{/if}

						<section class="mt-4 rounded-3xl border border-border bg-surface p-5">
							<h2 class="mb-4 text-sm font-medium text-ink">Delivery details</h2>
							<div class="flex flex-col gap-4">
								<div class="grid gap-4 sm:grid-cols-2">
									<Input
										label="Full name"
										bind:value={name}
										autocomplete="name"
										error={touched ? addressErrors.name : ''}
									/>
									<Input
										label="Mobile number"
										bind:value={phone}
										numeric
										inputmode="tel"
										hint="We call this number to confirm the order."
										error={touched ? addressErrors.phone : ''}
									/>
								</div>

								<div class="grid gap-4 sm:grid-cols-2">
									<Select
										label="District"
										value={districtId}
										placeholder="Choose your district"
										options={data.regions.districts.map((d) => ({ value: d.id, label: d.name }))}
										onchange={pickDistrict}
										error={touched ? addressErrors.district : ''}
									/>
									<Select
										label="Area / thana"
										bind:value={areaId}
										placeholder={districtId ? 'Choose your area' : 'Pick a district first'}
										options={areas.map((a) => ({ value: a.id, label: a.name }))}
									/>
								</div>

								{#if zoneInfo}
									<p
										class="flex items-center gap-2 text-sm text-ink-muted"
										transition:fade={fadeIn()}
									>
										<Truck size={16} class="shrink-0 text-primary" />
										{zoneInfo.label} delivery ·
										<span class="num font-medium text-ink">
											{shipping === 0 ? 'Free' : formatTk(shipping)}
										</span>
									</p>
								{/if}

								<Textarea
									label="Full address"
									bind:value={line}
									rows={3}
									placeholder="House, road, landmark"
									hint={touched ? addressErrors.line : ''}
								/>
								<Textarea label="Order note (optional)" bind:value={note} rows={2} />
							</div>
						</section>
					{:else if step === 1}
						<section class="rounded-3xl border border-border bg-surface p-5">
							<h2 class="mb-4 text-sm font-medium text-ink">How would you like to pay?</h2>
							<div class="flex flex-col gap-2">
								{#if data.payment.cod}
									<label
										class="flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors duration-[180ms] ease-brand
										       {paymentMethod === 'cod'
											? 'border-primary bg-primary-soft'
											: 'border-border hover:border-brand-300'}"
									>
										<input type="radio" value="cod" bind:group={paymentMethod} class="sr-only" />
										<Banknote size={18} class="mt-0.5 shrink-0 text-primary" />
										<span>
											<span class="block text-sm font-medium text-ink">Cash on delivery</span>
											<span class="block text-xs text-ink-muted">
												Pay the courier when it arrives. We call to confirm first.
											</span>
										</span>
									</label>
								{/if}
								{#if data.payment.sslcommerz}
									<label
										class="flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors duration-[180ms] ease-brand
										       {paymentMethod === 'sslcommerz'
											? 'border-primary bg-primary-soft'
											: 'border-border hover:border-brand-300'}"
									>
										<input
											type="radio"
											value="sslcommerz"
											bind:group={paymentMethod}
											class="sr-only"
										/>
										<CreditCard size={18} class="mt-0.5 shrink-0 text-primary" />
										<span>
											<span class="block text-sm font-medium text-ink">Pay online</span>
											<span class="block text-xs text-ink-muted">bKash, Nagad, Rocket or card.</span
											>
										</span>
									</label>
								{/if}
							</div>
						</section>
					{:else}
						<section class="rounded-3xl border border-border bg-surface">
							<div class="border-b border-border px-5 py-4">
								<h2 class="text-sm font-medium text-ink">Check everything over</h2>
							</div>

							<dl class="divide-y divide-border">
								<div class="flex gap-4 px-5 py-4">
									<dt class="w-28 shrink-0 text-sm text-ink-muted">Deliver to</dt>
									<dd class="text-sm text-ink">
										{name}<br />
										<span class="num"
											>{normalizePhone(phone) ? formatPhone(normalizePhone(phone)!) : phone}</span
										><br />
										{line}<br />
										{areaName ? `${areaName}, ` : ''}{districtName}
									</dd>
								</div>
								<div class="flex gap-4 px-5 py-4">
									<dt class="w-28 shrink-0 text-sm text-ink-muted">Delivery</dt>
									<dd class="text-sm text-ink">
										{zoneInfo?.label ?? '—'} ·
										<span class="num">{shipping === 0 ? 'Free' : formatTk(shipping)}</span>
									</dd>
								</div>
								<div class="flex gap-4 px-5 py-4">
									<dt class="w-28 shrink-0 text-sm text-ink-muted">Payment</dt>
									<dd class="text-sm text-ink">
										{paymentMethod === 'cod' ? 'Cash on delivery' : 'Pay online'}
									</dd>
								</div>
								{#if note.trim()}
									<div class="flex gap-4 px-5 py-4">
										<dt class="w-28 shrink-0 text-sm text-ink-muted">Note</dt>
										<dd class="text-sm text-ink">{note}</dd>
									</div>
								{/if}
							</dl>
						</section>
					{/if}
				</div>
			{/key}

			<!-- Step controls -->
			<div class="flex items-center gap-3">
				{#if step > 0}
					<Button variant="secondary" type="button" onclick={back}>
						<ArrowLeft size={16} />
						Back
					</Button>
				{/if}

				{#if step < steps.length - 1}
					<Button type="button" onclick={next} class="ml-auto">
						Continue
						<ArrowRight size={16} />
					</Button>
				{:else}
					<Button type="submit" size="lg" loading={submitting} class="ml-auto">
						Place order · <span class="num">{formatTk(total)}</span>
					</Button>
				{/if}
			</div>

			{#if step === 0 && touched && !addressValid}
				<p class="text-sm text-sale" role="alert" transition:fade={fadeIn()}>
					Fill in the highlighted fields to continue.
				</p>
			{/if}
		</form>

		<aside class="h-fit rounded-3xl border border-border bg-surface p-5 lg:sticky lg:top-28">
			<h2 class="text-sm font-medium text-ink">Order summary</h2>

			<ul class="mt-4 flex flex-col gap-3">
				{#each data.lines as l (l.id)}
					<li class="flex items-center gap-3">
						<span class="size-12 shrink-0 overflow-hidden rounded-xl bg-surface-alt">
							{#if l.image}<img src={l.image} alt="" class="size-full object-cover" />{/if}
						</span>
						<span class="min-w-0 flex-1">
							<span class="block truncate text-sm text-ink">{l.title}</span>
							<span class="num block text-xs text-ink-muted">
								{l.qty} × {formatTk(l.unitPrice)}
							</span>
						</span>
						<span class="num text-sm font-medium text-ink">{formatTk(l.lineTotal)}</span>
					</li>
				{/each}
			</ul>

			<form method="POST" action="?/coupon" use:enhance class="mt-4 border-t border-border pt-4">
				<input type="hidden" name="districtId" value={districtId} />
				<input type="hidden" name="areaId" value={areaId} />
				<div class="flex gap-2">
					<Input
						name="code"
						bind:value={couponInput}
						placeholder="Coupon code"
						class="flex-1"
						aria-label="Coupon code"
					/>
					<Button variant="secondary" type="submit" class="mt-0 self-end">Apply</Button>
				</div>
				{#if form?.couponError}
					<p class="mt-2 text-xs text-sale">{form.couponError}</p>
				{/if}
				{#if coupon}
					<p class="mt-2 flex items-center gap-1.5 text-xs text-success" transition:fade={fadeIn()}>
						<Check size={13} />
						{coupon.label} applied
					</p>
				{/if}
			</form>

			<dl class="mt-4 flex flex-col gap-2.5 border-t border-border pt-4 text-sm">
				<div class="flex justify-between">
					<dt class="text-ink-muted">Subtotal</dt>
					<dd class="num text-ink">{formatTk(data.subtotal)}</dd>
				</div>
				<div class="flex justify-between">
					<dt class="text-ink-muted">Delivery</dt>
					<dd class="num text-ink">
						{zoneInfo ? (shipping === 0 ? 'Free' : formatTk(shipping)) : '—'}
					</dd>
				</div>
				{#if discount > 0}
					<div class="flex justify-between">
						<dt class="flex items-center gap-1.5 text-ink-muted">
							<Tag size={13} />
							Discount
						</dt>
						<dd class="num text-success">−{formatTk(discount)}</dd>
					</div>
				{/if}
			</dl>

			<div class="mt-4 flex items-baseline justify-between border-t border-border pt-4">
				<span class="font-medium text-ink">Total</span>
				<span class="num text-xl font-semibold text-ink">{formatTk(total)}</span>
			</div>

			<p class="mt-3 text-center text-xs text-ink-faint">
				We call every order to confirm before dispatch.
			</p>
		</aside>
	</div>
</div>
