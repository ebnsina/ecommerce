<script lang="ts">
	import { SHOP } from '$lib/paths';
	import { untrack, onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import { enhance } from '$app/forms';
	import { track } from '$lib/track';
	import { page } from '$app/state';
	import {
		ChevronRight,
		Heart,
		ShoppingBag,
		Phone,
		Share2,
		Zap,
		Check,
		Minus,
		Plus
	} from '@lucide/svelte';
	import { assuranceIcon } from '$lib/assuranceIcons';
	import { formatTk, discountPercent } from '$lib/money';
	import Rating from '$lib/shop/Rating.svelte';
	import { SiWhatsapp, SiFacebook } from '$lib/shop/brandIcons';
	import ProductSection from '$lib/shop/ProductSection.svelte';
	import ProductTabs from '$lib/shop/ProductTabs.svelte';
	import BundleOffer from '$lib/shop/BundleOffer.svelte';
	import Button from '$lib/ui/Button.svelte';

	let { data, form } = $props();

	let activeImage = $state(0);
	let qty = $state(1);
	/* Defaults to the first value of each option; reset when the route changes. */
	let chosen = $state<Record<string, string>>(
		Object.fromEntries(untrack(() => data.options.map((o) => [o.name, o.values[0]] as const)))
	);

	$effect(() => {
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions -- read to register a reactive dependency
		data.product.id;
		activeImage = 0;
		qty = 1;
		chosen = Object.fromEntries(
			untrack(() => data.options.map((o) => [o.name, o.values[0]] as const))
		);
	});

	const key = (v: Record<string, string>) => data.options.map((o) => v[o.name]).join(' / ');

	const variant = $derived(
		data.options.length
			? (data.variants.find((v) => key(v.optionValues) === key(chosen)) ?? null)
			: null
	);

	/** A value is only selectable if some active variant carries it. */
	function available(name: string, value: string) {
		if (!data.options.length) return true;
		return data.variants.some((v) => v.optionValues[name] === value && v.stock > 0);
	}

	const price = $derived(variant?.price ?? data.product.price);

	// Viewing a product is what the ad platforms build retargeting audiences
	// from. Adding to the cart re-runs the load, which hands us a fresh `data`
	// object for the same product — reporting that as a second view would
	// inflate every view count, so the id is what decides.
	let viewed = $state('');
	$effect(() => {
		if (viewed === data.product.id) return;
		viewed = data.product.id;
		track({
			kind: 'view_item',
			value: data.product.price,
			items: [
				{
					id: data.product.id,
					name: data.product.title,
					price: data.product.price,
					quantity: 1
				}
			]
		});
	});
	const compareAt = $derived(variant?.compareAtPrice ?? data.product.compareAtPrice);
	const stock = $derived(data.options.length ? (variant?.stock ?? 0) : data.product.stock);
	const off = $derived(discountPercent(price, compareAt));

	/* Specs come from what the catalog already knows. A dedicated spec table can
	   come later; this is honest and needs no new admin screen. */
	const specs = $derived(
		[
			{ label: 'Brand', value: data.product.brand ?? '' },
			{ label: 'Category', value: data.categories.map((c) => c.name).join(', ') },
			{ label: 'SKU', value: variant?.id ? (variant.sku ?? '') : '' },
			...data.options
				.map((o) => ({ name: o.name, values: o.values }))
				.map((o) => ({
					label: o.name,
					value: o.values.join(', ')
				})),
			{ label: 'Availability', value: stock > 0 ? `${stock} in stock` : 'Out of stock' }
		].filter((s) => s.value)
	);

	/* Schema.org Product. Only fields we genuinely have — a fabricated
	   aggregateRating or availability is worse than omitting it. */
	const jsonLd = $derived(
		JSON.stringify({
			'@context': 'https://schema.org',
			'@type': 'Product',
			name: data.product.title,
			description: data.product.seoDescription || data.product.description || undefined,
			sku: variant?.sku || undefined,
			image: data.images.length ? data.images : undefined,
			brand: data.product.brand ? { '@type': 'Brand', name: data.product.brand } : undefined,
			aggregateRating:
				data.product.reviewCount > 0
					? {
							'@type': 'AggregateRating',
							ratingValue: (data.product.rating / 10).toFixed(1),
							reviewCount: data.product.reviewCount
						}
					: undefined,
			offers: {
				'@type': 'Offer',
				priceCurrency: 'BDT',
				price: (price / 100).toFixed(2),
				availability: stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
				itemCondition: 'https://schema.org/NewCondition'
			}
		})
	);

	/* Order channels. In BD a large share of orders start in chat or on a call,
	   so a product page that only offers a cart loses those buyers outright. */
	/* Reassurance list is store-wide content, edited in Settings. */
	const assurances = $derived(data.settings.assurances ?? []);

	const contact = $derived(
		data.settings.contact ?? { whatsapp: '', messenger: '', callEnabled: true }
	);

	const shareUrl = $derived(
		typeof location !== 'undefined' ? location.href : `/demo/p/${data.product.slug}`
	);

	const waLink = $derived(
		contact.whatsapp
			? `https://wa.me/88${contact.whatsapp.replace(/\D/g, '').replace(/^88/, '')}` +
					`?text=${encodeURIComponent(`Hi! I want to order:\n${data.product.title}\n${formatTk(price)}\n${shareUrl}`)}`
			: ''
	);
	/* The ref rides along to the webhook, so the inbox knows which product the
	   conversation started from. */
	const fbLink = $derived(
		contact.messenger
			? `https://m.me/${contact.messenger}?ref=${encodeURIComponent(data.product.slug)}`
			: ''
	);

	/* Delivery estimate straight from the settings table, so it can never
	   contradict what checkout actually charges. */
	const zones = $derived(
		Object.values(data.settings.delivery ?? {}).map((z) => ({
			label: z.label,
			charge: z.charge,
			free: z.freeAbove > 0 && price >= z.freeAbove
		}))
	);

	let copied = $state(false);
	async function share() {
		const payload = { title: data.product.title, url: shareUrl };
		if (navigator.share) return navigator.share(payload).catch(() => {});
		await navigator.clipboard.writeText(shareUrl);
		copied = true;
		setTimeout(() => (copied = false), 1500);
	}

	/* Sticky mobile bar once the real buttons scroll away — on a phone the
	   add-to-cart is off-screen for most of the page. */
	let buyBox = $state<HTMLElement | null>(null);
	let showBar = $state(false);
	onMount(() => {
		if (!buyBox) return;
		const io = new IntersectionObserver(([e]) => (showBar = !e.isIntersecting), { threshold: 0 });
		io.observe(buyBox);
		return () => io.disconnect();
	});

	const gallery = $derived(
		variant?.image
			? [variant.image, ...data.images.filter((i) => i !== variant.image)]
			: data.images
	);
</script>

<svelte:head>
	<title>{data.product.seoTitle || data.product.title} · {data.settings.store.name}</title>
	{#if data.product.seoDescription}
		<meta name="description" content={data.product.seoDescription} />
	{/if}
	<!-- The closing tag is interpolated so the literal characters never appear in
	     the template: a bare </script> here ends the element for the parser. -->
	<!-- eslint-disable-next-line svelte/no-at-html-tags -- JSON-LD we build ourselves from the product row -->
	{@html `<script type="application/ld+json">${jsonLd}</${'script'}>`}
</svelte:head>

<div class="mx-auto max-w-7xl px-4 py-6">
	<nav aria-label="Breadcrumb" class="flex flex-wrap items-center gap-1 text-xs text-ink-muted">
		<a href={SHOP} class="hover:text-ink">Home</a>
		{#if data.categories[0]}
			<ChevronRight size={13} class="text-ink-faint" />
			<a href="/demo/c/{data.categories[0].slug}" class="hover:text-ink"
				>{data.categories[0].name}</a
			>
		{/if}
		<ChevronRight size={13} class="text-ink-faint" />
		<span class="truncate font-medium text-ink">{data.product.title}</span>
	</nav>

	<div class="mt-5 grid gap-8 lg:grid-cols-2">
		<!-- gallery -->
		<div class="flex flex-col gap-3">
			<div class="aspect-square overflow-hidden rounded-3xl border border-border bg-surface-alt">
				{#if gallery[activeImage]}
					<img src={gallery[activeImage]} alt={data.product.title} class="size-full object-cover" />
				{/if}
			</div>
			{#if gallery.length > 1}
				<div class="flex gap-2 overflow-x-auto pb-1">
					{#each gallery as img, i (img)}
						<button
							class="size-18 shrink-0 overflow-hidden rounded-2xl border transition-colors duration-[180ms] ease-brand
							       {i === activeImage ? 'border-primary' : 'border-border hover:border-brand-300'}"
							onclick={() => (activeImage = i)}
							aria-label="Image {i + 1}"
						>
							<img src={img} alt="" class="size-full object-cover" />
						</button>
					{/each}
				</div>
			{/if}
		</div>

		<!-- details -->
		<div>
			{#if data.product.brand}
				<p class="text-sm text-ink-muted">{data.product.brand}</p>
			{/if}
			<h1 class="mt-1 text-2xl font-semibold tracking-tight text-ink">{data.product.title}</h1>
			{#if data.product.titleBn}
				<p class="mt-1 text-ink-muted">{data.product.titleBn}</p>
			{/if}

			<div class="mt-3">
				<Rating rating={data.product.rating} count={data.product.reviewCount} size={15} />
			</div>

			<div class="mt-4 flex flex-wrap items-baseline gap-3">
				<span class="num text-3xl font-semibold text-ink">{formatTk(price)}</span>
				{#if off > 0 && compareAt}
					<span class="num text-lg text-ink-faint line-through">{formatTk(compareAt)}</span>
					<span class="num rounded-lg bg-sale/10 px-2 py-0.5 text-sm font-medium text-sale">
						-{off}%
					</span>
				{/if}
			</div>

			{#each data.options as opt (opt.name)}
				<div class="mt-5">
					<p class="text-sm font-medium text-ink">{opt.name}</p>
					<div class="mt-2 flex flex-wrap gap-2">
						{#each opt.values as v (v)}
							{@const ok = available(opt.name, v)}
							<button
								class="rounded-xl border px-3.5 py-2 text-sm transition-colors duration-[180ms] ease-brand
								       {chosen[opt.name] === v
									? 'border-primary bg-primary-soft font-medium text-primary'
									: 'border-border text-ink hover:border-brand-300'}
								       {ok ? '' : 'text-ink-faint line-through opacity-60'}"
								disabled={!ok}
								onclick={() => (chosen = { ...chosen, [opt.name]: v })}
							>
								{v}
							</button>
						{/each}
					</div>
				</div>
			{/each}

			<!-- Buy box. `bind:this` anchors the sticky mobile bar below. -->
			<div bind:this={buyBox} class="mt-6">
				<form
					method="POST"
					action="?/add"
					use:enhance={() =>
						async ({ result, update }) => {
							// The action redirects back to this page, so a successful add
							// arrives as 'redirect', not 'success'. Only 'failure' means
							// nothing was added.
							if (result.type !== 'failure' && result.type !== 'error')
								track({
									kind: 'add_to_cart',
									value: price * qty,
									items: [
										{
											id: data.product.id,
											name: data.product.title,
											price,
											quantity: qty
										}
									]
								});
							await update();
						}}
					class="flex flex-wrap items-center gap-3"
				>
					<input type="hidden" name="productId" value={data.product.id} />
					{#if variant}<input type="hidden" name="variantId" value={variant.id} />{/if}
					<input type="hidden" name="qty" value={qty} />

					<div class="flex h-12 items-center rounded-xl border border-border">
						<button
							type="button"
							class="grid size-11 place-items-center text-ink-muted hover:text-ink"
							aria-label="Decrease quantity"
							onclick={() => (qty = Math.max(1, qty - 1))}
						>
							<Minus size={15} />
						</button>
						<span class="num w-10 text-center text-sm font-medium text-ink">{qty}</span>
						<button
							type="button"
							class="grid size-11 place-items-center text-ink-muted hover:text-ink disabled:opacity-40"
							aria-label="Increase quantity"
							disabled={qty >= stock}
							onclick={() => (qty = Math.min(stock || 1, qty + 1))}
						>
							<Plus size={15} />
						</button>
					</div>

					<Button size="lg" variant="secondary" type="submit" disabled={stock <= 0}>
						<ShoppingBag size={17} />
						{stock > 0 ? 'Add to cart' : 'Out of stock'}
					</Button>

					<!-- Buy now skips the cart entirely: most BD orders are a single
					     impulse item, and every extra screen loses some of them. -->
					<Button size="lg" type="submit" disabled={stock <= 0} formaction="?/buy">
						<Zap size={17} />
						Buy now
					</Button>
					<input type="hidden" name="redirectTo" value={page.url.pathname} />
				</form>

				{#if stock > 0 && stock <= 5}
					<p class="mt-2 text-sm font-medium text-sale">
						Only <span class="num">{stock}</span> left — order soon.
					</p>
				{/if}
			</div>

			<!-- Order without a form at all. -->
			{#if waLink || fbLink || (contact.callEnabled && data.settings.store.phone)}
				<div class="mt-4">
					<p class="text-xs font-medium tracking-wide text-ink-muted uppercase">
						Or order directly
					</p>
					<div class="mt-2 flex flex-wrap gap-2">
						{#if waLink}
							<a
								href={waLink}
								target="_blank"
								rel="noopener"
								class="flex h-11 items-center gap-2 rounded-xl bg-[#25D366] px-4 text-sm font-medium text-white
								       transition-opacity duration-[180ms] ease-brand hover:opacity-90"
							>
								<SiWhatsapp size={17} />
								WhatsApp
							</a>
						{/if}
						{#if fbLink}
							<a
								href={fbLink}
								target="_blank"
								rel="noopener"
								class="flex h-11 items-center gap-2 rounded-xl bg-[#0866FF] px-4 text-sm font-medium text-white
								       transition-opacity duration-[180ms] ease-brand hover:opacity-90"
							>
								<SiFacebook size={17} />
								Messenger
							</a>
						{/if}
						{#if contact.callEnabled && data.settings.store.phone}
							<a
								href="tel:{data.settings.store.phone}"
								class="flex h-11 items-center gap-2 rounded-xl border border-border px-4 text-sm font-medium
								       text-ink transition-colors duration-[180ms] ease-brand hover:border-brand-300"
							>
								<Phone size={16} />
								Call to order
							</a>
						{/if}
						<button
							type="button"
							onclick={share}
							class="flex h-11 items-center gap-2 rounded-xl border border-border px-4 text-sm
							       text-ink-muted transition-colors duration-[180ms] ease-brand hover:border-brand-300 hover:text-ink"
						>
							{#if copied}<Check size={16} class="text-success" />{:else}<Share2 size={16} />{/if}
							{copied ? 'Link copied' : 'Share'}
						</button>
					</div>
				</div>
			{/if}

			<!-- Delivery charges read from settings, so they cannot drift from checkout. -->
			{#if zones.length}
				<div class="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-ink-muted">
					{#each zones as z (z.label)}
						<span>
							{z.label}
							<span class="num font-medium text-ink">
								{z.free ? 'free' : formatTk(z.charge)}
							</span>
						</span>
					{/each}
				</div>
			{/if}

			<form method="POST" action="?/wishlist" use:enhance class="mt-4">
				<input type="hidden" name="productId" value={data.product.id} />
				<input type="hidden" name="redirectTo" value={page.url.pathname} />
				<button
					class="flex items-center gap-2 text-sm text-ink-muted transition-colors hover:text-sale"
				>
					<Heart size={17} />
					Save to wishlist
				</button>
			</form>

			{#if form?.error}
				<p
					class="mt-3 rounded-2xl border border-sale/30 bg-sale/8 px-4 py-3 text-sm text-sale"
					role="alert"
				>
					{form.error}
				</p>
			{/if}

			<p class="mt-3 text-sm text-ink-muted">
				{#if stock > 0}
					<span class="num font-medium text-success">{stock}</span> in stock
				{:else}
					Currently unavailable
				{/if}
			</p>

			{#each data.bundles as bundle (bundle.id)}
				<BundleOffer {bundle} redirectTo={page.url.pathname} />
			{/each}

			{#if assurances.length}
				<ul class="mt-6 flex flex-col gap-3 rounded-3xl bg-surface-alt p-5">
					{#each assurances as f (f.title)}
						{@const Icon = assuranceIcon(f.icon)}
						<li class="flex items-start gap-3">
							<span
								class="mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary"
							>
								<Icon size={14} />
							</span>
							<span class="min-w-0">
								<span class="block text-sm font-medium text-ink">{f.title}</span>
								<span class="block text-xs text-ink-muted">{f.note}</span>
							</span>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	</div>
</div>

{#if showBar && stock > 0}
	<div
		class="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/90 p-3 backdrop-blur-xl lg:hidden"
		transition:fly={{ y: 60, duration: 200 }}
	>
		<div class="mx-auto flex max-w-7xl items-center gap-3">
			<div class="min-w-0 flex-1">
				<p class="truncate text-xs text-ink-muted">{data.product.title}</p>
				<p class="num text-sm font-semibold text-ink">{formatTk(price)}</p>
			</div>
			{#if waLink}
				<a
					href={waLink}
					target="_blank"
					rel="noopener"
					class="grid size-11 shrink-0 place-items-center rounded-xl bg-[#25D366] text-white"
					aria-label="Order on WhatsApp"
				>
					<SiWhatsapp size={18} />
				</a>
			{/if}
			<form method="POST" action="?/buy" use:enhance class="shrink-0">
				<input type="hidden" name="productId" value={data.product.id} />
				{#if variant}<input type="hidden" name="variantId" value={variant.id} />{/if}
				<input type="hidden" name="qty" value={qty} />
				<Button type="submit">
					<Zap size={16} />
					Buy now
				</Button>
			</form>
		</div>
	</div>
{/if}

<ProductTabs
	product={data.product}
	{specs}
	reviews={data.reviews}
	questions={data.questions}
	customerName={data.customer?.name ?? ''}
	{form}
/>

<!-- What other buyers of this actually took as well. It only appears once
     there is real order history behind it. -->
{#if data.alsoBought.length}
	<ProductSection title="Customers also bought" products={data.alsoBought} />
{/if}

<ProductSection title="You may also like" products={data.related} />
