<script lang="ts">
	import { SHOP } from '$lib/paths';
	import {
		Search,
		Heart,
		ShoppingBag,
		User,
		Menu,
		X,
		ChevronDown,
		Scale,
		MapPin
	} from '@lucide/svelte';
	import { formatTk } from '$lib/money';
	import { slide, fly } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { slideOpen, flyUp, reduced } from '$lib/motion';
	import PromoBar from '$lib/blocks/PromoBar.svelte';

	type Cat = {
		id: string;
		name: string;
		nameBn: string | null;
		slug: string;
		image: string | null;
		children: { id: string; name: string; slug: string }[];
	};

	type MenuNode = { label: string; labelBn?: string; href: string; children?: MenuNode[] };

	let {
		nav,
		menu = [],
		store,
		chrome = 'mega',
		categoriesButton = true,
		searchHints = [],
		promo,
		customer,
		cartCount = 0,
		cartSubtotal = 0,
		compareCount = 0,
		wishlistCount = 0
	}: {
		nav: Cat[];
		menu?: MenuNode[];
		/** `mega` spreads the categories across a bar; `slim` folds them into one
		    button and lets search lead, the way a bookshop does; `grocery` adds
		    the delivery slot and a basket carrying its running total; `centered`
		    drops the coloured bar altogether. */
		chrome?: 'mega' | 'slim' | 'centered' | 'grocery';
		/** Set false where a category rail is already on screen — the same list
		    twice, one of them behind a click, is worse than either alone. */
		categoriesButton?: boolean;
		searchHints?: string[];
		store: {
			name: string;
			logo?: { mode: 'text' | 'image'; text: string; image: string | null };
		};
		promo: {
			text: string;
			textBn: string;
			href: string;
			active: boolean;
			dismissible: boolean;
			background: string;
		};
		customer: { name: string | null } | null;
		cartCount?: number;
		/** Poisha. Shown in the basket button on the grocery chrome. */
		cartSubtotal?: number;
		compareCount?: number;
		wishlistCount?: number;
	} = $props();

	let q = $state(page.url.searchParams.get('q') ?? '');

	/* A saved header menu wins; otherwise the visible category tree stands in,
	   so a new store has a working nav before anyone opens the menu builder. */
	const items = $derived(
		menu.length
			? menu.map((m, i) => ({
					key: `m${i}`,
					label: m.label,
					href: m.href,
					children: (m.children ?? []).map((c, j) => ({
						key: `m${i}-${j}`,
						label: c.label,
						href: c.href
					}))
				}))
			: nav.map((c) => ({
					key: c.id,
					label: c.name,
					href: `/demo/c/${c.slug}`,
					children: c.children.map((s) => ({ key: s.id, label: s.name, href: `/demo/c/${s.slug}` }))
				}))
	);

	const cartLabel = $derived(cartCount > 0 ? `Cart, ${cartCount} items` : 'Cart');
	let openMenu = $state<string | null>(null);
	let mobileOpen = $state(false);
	let searchFocused = $state(false);

	/* Typewriter search hint. It is an overlay, not the native `placeholder`, so it
	   can animate — and it clears the moment the field is focused or typed in. */
	/* Hints come from Settings — nothing shopper-facing is written in code. */
	const hints = $derived(searchHints.length ? searchHints : ['Search products']);
	let typed = $state('');

	$effect(() => {
		if (reduced()) {
			typed = hints[0];
			return;
		}
		let phrase = 0;
		let chars = 0;
		let dir = 1;
		let timer: ReturnType<typeof setTimeout>;

		const tick = () => {
			const full = hints[phrase];
			chars += dir;
			typed = full.slice(0, chars);

			let delay = dir > 0 ? 55 : 28;
			if (chars >= full.length) {
				dir = -1;
				delay = 1600; // hold the finished phrase
			} else if (chars <= 0) {
				dir = 1;
				phrase = (phrase + 1) % hints.length;
				delay = 350;
			}
			timer = setTimeout(tick, delay);
		};

		timer = setTimeout(tick, 500);
		return () => clearTimeout(timer);
	});

	const showHint = $derived(!q && !searchFocused);

	function submit(e: SubmitEvent) {
		e.preventDefault();
		goto(q.trim() ? `/demo/search?q=${encodeURIComponent(q.trim())}` : '/demo/search');
	}
</script>

{#snippet badge(n: number, onBrand: boolean)}
	{#if n > 0}
		<!-- The count is the point of the icon; leaving it off the cart was the
		     one place a shopper could not tell whether the last tap worked. -->
		<span
			class="num absolute top-1 right-1 grid h-4 min-w-4 place-items-center rounded-full bg-sale px-1
			       text-[10px] font-semibold text-white {onBrand ? 'ring-2 ring-primary' : ''}"
		>
			{n > 99 ? '99+' : n}
		</span>
	{/if}
{/snippet}

<header class="sticky top-0 z-40 bg-surface">
	<!-- Promo bar is a store-wide setting, not a page block — it shows everywhere. -->
	{#if promo?.active && promo.text}
		<PromoBar props={promo} />
	{/if}

	{#if chrome === 'centered'}
		<!-- A shop with forty things in it does not need a search engine at the
		     top of every page. The name sits in the middle, the categories sit
		     under it, and the ground stays the page's own. -->
		<div class="border-b border-border">
			<div class="mx-auto max-w-7xl px-4">
				<div class="relative flex h-20 items-center justify-center">
					<button
						class="absolute left-0 grid size-10 place-items-center rounded-xl text-ink-muted transition-colors hover:text-ink lg:hidden"
						aria-label="Menu"
						onclick={() => (mobileOpen = !mobileOpen)}
					>
						{#if mobileOpen}<X size={20} />{:else}<Menu size={20} />{/if}
					</button>

					<a href={SHOP} class="flex items-center" aria-label={store.name}>
						{#if store.logo?.mode === 'image' && store.logo.image}
							<img src={store.logo.image} alt={store.name} class="h-9 w-auto object-contain" />
						{:else}
							<span class="text-xl font-semibold tracking-[0.2em] text-ink uppercase">
								{store.logo?.text || store.name}
							</span>
						{/if}
					</a>

					<nav class="absolute right-0 flex items-center gap-1">
						<a
							href="/demo/search"
							class="grid size-10 place-items-center rounded-xl text-ink-muted transition-colors hover:text-ink"
							aria-label="Search"
						>
							<Search size={19} />
						</a>
						<a
							href="/demo/account/wishlist"
							class="relative grid size-10 place-items-center rounded-xl text-ink-muted transition-colors hover:text-ink"
							aria-label={wishlistCount ? `Wishlist, ${wishlistCount} saved` : 'Wishlist'}
						>
							<Heart size={19} />
							{@render badge(wishlistCount, false)}
						</a>
						<a
							href="/demo/cart"
							class="relative grid size-10 place-items-center rounded-xl text-ink-muted transition-colors hover:text-ink"
							aria-label={cartLabel}
						>
							<ShoppingBag size={19} />
							{@render badge(cartCount, false)}
						</a>
						<a
							href={customer ? '/demo/account' : '/demo/login'}
							class="grid size-10 place-items-center rounded-xl text-ink-muted transition-colors hover:text-ink"
							aria-label={customer?.name ?? 'Sign in'}
						>
							<User size={19} />
						</a>
					</nav>
				</div>

				<ul class="hidden justify-center gap-8 pb-4 lg:flex">
					{#each items as cat (cat.key)}
						<li>
							<a
								href={cat.href}
								class="text-xs tracking-[0.14em] text-ink-muted uppercase transition-colors hover:text-ink"
							>
								{cat.label}
							</a>
						</li>
					{/each}
				</ul>
			</div>
		</div>
	{:else}
		<div class="bg-primary">
			<div class="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
				<button
					class="-ml-1 grid size-10 place-items-center rounded-xl text-white/85 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
					aria-label="Menu"
					onclick={() => (mobileOpen = !mobileOpen)}
				>
					{#if mobileOpen}<X size={20} />{:else}<Menu size={20} />{/if}
				</button>

				<a href={SHOP} class="flex shrink-0 items-center" aria-label={store.name}>
					{#if store.logo?.mode === 'image' && store.logo.image}
						<img src={store.logo.image} alt={store.name} class="h-8 w-auto object-contain" />
					{:else}
						<span class="text-lg font-semibold tracking-tight text-white">
							{store.logo?.text || store.name}
						</span>
					{/if}
				</a>

				{#if chrome === 'grocery'}
					<!-- Where it goes and when it arrives, said before anything is put in
					     the basket. A grocery order is planned around the slot, so a shop
					     that makes you find it has already lost the argument. -->
					<a
						href="/demo/pages/delivery"
						class="hidden h-11 shrink-0 items-center gap-2 rounded-xl px-3 text-left text-white/85 transition-colors hover:bg-white/10 hover:text-white lg:flex"
					>
						<MapPin size={17} aria-hidden="true" />
						<span class="leading-tight">
							<span class="block text-[0.6875rem] opacity-80">Deliver to</span>
							<span class="block text-xs font-medium">Dhaka · today, 6–9 PM</span>
						</span>
					</a>
				{/if}

				{#if categoriesButton && (chrome === 'slim' || chrome === 'grocery')}
					<!-- One button instead of a bar. The panel lists exactly what the bar
				     would have, so nothing becomes unreachable. -->
					<div class="relative hidden lg:block">
						<button
							class="flex h-11 items-center gap-2 rounded-xl px-3 text-sm text-white/85 transition-colors hover:bg-white/10 hover:text-white"
							aria-expanded={openMenu === 'all'}
							onclick={() => (openMenu = openMenu === 'all' ? null : 'all')}
						>
							<Menu size={18} />
							Categories
							<ChevronDown size={14} />
						</button>

						{#if openMenu === 'all'}
							<div
								class="absolute top-full left-0 z-50 mt-2 grid w-[26rem] grid-cols-2 gap-1 rounded-2xl border border-border bg-surface p-2"
								transition:fly={flyUp()}
							>
								{#each items as cat (cat.key)}
									<a
										href={cat.href}
										class="rounded-xl px-3 py-2 text-sm text-ink-muted transition-colors hover:bg-surface-alt hover:text-ink"
										onclick={() => (openMenu = null)}
									>
										{cat.label}
									</a>
								{/each}
							</div>
						{/if}
					</div>
				{/if}

				<form onsubmit={submit} class="relative hidden min-w-0 flex-1 md:block">
					<Search
						size={16}
						class="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-faint"
					/>
					<input
						bind:value={q}
						type="search"
						aria-label="Search products"
						onfocus={() => (searchFocused = true)}
						onblur={() => (searchFocused = false)}
						class="h-11 w-full rounded-xl border border-transparent bg-surface pr-4 pl-10
					       text-sm text-ink transition-colors duration-[180ms] ease-brand focus:border-brand-200"
					/>

					{#if showHint}
						<span
							class="pointer-events-none absolute inset-y-0 right-4 left-10 flex items-center overflow-hidden
						       text-sm whitespace-nowrap text-ink-faint"
							aria-hidden="true"
						>
							{typed}<span
								class="ml-0.5 inline-block h-4 w-px animate-pulse bg-ink-faint align-middle"
							></span>
						</span>
					{/if}
				</form>

				<nav class="ml-auto flex items-center gap-1">
					<a
						href="/demo/compare"
						class="relative grid size-10 place-items-center rounded-xl text-white/85 transition-colors hover:bg-white/10 hover:text-white"
						aria-label={compareCount ? `Compare, ${compareCount} products` : 'Compare'}
					>
						<Scale size={19} />
						{#if compareCount > 0}
							<span
								class="num absolute top-1 right-1 grid h-4 min-w-4 place-items-center rounded-full
							       bg-sale px-1 text-[10px] font-semibold text-white ring-2 ring-primary"
							>
								{compareCount}
							</span>
						{/if}
					</a>
					<a
						href="/demo/account/wishlist"
						class="grid size-10 place-items-center rounded-xl text-white/85 transition-colors hover:bg-white/10 hover:text-white"
						aria-label="Wishlist"
					>
						<Heart size={19} />
					</a>
					{#if chrome === 'grocery'}
						<!-- The running total, out loud. Twenty small decisions add up, and
						     the shopper is entitled to watch them adding up. -->
						<a
							href="/demo/cart"
							class="flex h-10 items-center gap-2 rounded-xl bg-white/15 px-3 text-sm font-medium text-white transition-colors hover:bg-white/25"
							aria-label={cartLabel}
						>
							<ShoppingBag size={18} />
							<span class="num">{formatTk(cartSubtotal)}</span>
						</a>
					{:else}
						<a
							href="/demo/cart"
							class="relative grid size-10 place-items-center rounded-xl text-white/85 transition-colors hover:bg-white/10 hover:text-white"
							aria-label={cartLabel}
						>
							<ShoppingBag size={19} />
							{@render badge(cartCount, true)}
						</a>
					{/if}
					<a
						href={customer ? '/demo/account' : '/demo/login'}
						class="flex h-10 items-center gap-2 rounded-xl px-2.5 text-white/85 transition-colors hover:bg-white/10 hover:text-white"
					>
						<User size={19} />
						<span class="hidden text-sm sm:inline">{customer?.name ?? 'Sign in'}</span>
					</a>
				</nav>
			</div>
		</div>
	{/if}

	<!-- category bar with mega menu -->
	{#if chrome === 'mega'}
		<div class="hidden bg-surface/70 backdrop-blur-xl lg:block">
			<div class="mx-auto max-w-7xl px-4">
				<ul class="flex items-center gap-1">
					{#each items as cat (cat.key)}
						<li
							class="relative"
							onpointerenter={() => (openMenu = cat.key)}
							onpointerleave={() => (openMenu = null)}
						>
							<a
								href={cat.href}
								class="flex items-center gap-1 px-3 py-3 text-sm text-ink-muted transition-colors hover:text-primary"
							>
								{cat.label}
								{#if cat.children.length}<ChevronDown size={14} />{/if}
							</a>

							{#if openMenu === cat.key && cat.children.length}
								<div
									class="absolute top-full left-0 z-50 min-w-56 rounded-2xl border border-border bg-surface p-2"
									transition:fly={flyUp()}
								>
									{#each cat.children as sub (sub.key)}
										<a
											href={sub.href}
											class="block rounded-xl px-3 py-2 text-sm text-ink-muted transition-colors hover:bg-surface-alt hover:text-ink"
										>
											{sub.label}
										</a>
									{/each}
								</div>
							{/if}
						</li>
					{/each}
				</ul>
			</div>
		</div>
	{/if}

	{#if mobileOpen}
		<div class="border-b border-border lg:hidden" transition:slide={slideOpen()}>
			<form onsubmit={submit} class="relative p-4">
				<Search
					size={16}
					class="pointer-events-none absolute top-1/2 left-7 -translate-y-1/2 text-ink-faint"
				/>
				<input
					bind:value={q}
					type="search"
					placeholder="Search products"
					class="h-11 w-full rounded-xl border border-border bg-surface-alt pr-4 pl-10 text-sm"
				/>
			</form>
			<ul class="px-2 pb-3">
				{#each nav as cat (cat.id)}
					<li>
						<a
							href="/demo/c/{cat.slug}"
							class="block rounded-xl px-4 py-2.5 text-sm font-medium text-ink"
						>
							{cat.name}
						</a>
						{#each cat.children as sub (sub.id)}
							<a
								href="/demo/c/{sub.slug}"
								class="block rounded-xl px-8 py-2 text-sm text-ink-muted"
							>
								{sub.name}
							</a>
						{/each}
					</li>
				{/each}
			</ul>
		</div>
	{/if}
</header>
