<script lang="ts">
	import {
		Search,
		Heart,
		ShoppingBag,
		User,
		Menu,
		X,
		ChevronDown,
		Phone,
		Scale
	} from '@lucide/svelte';
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
		searchHints = [],
		promo,
		customer,
		cartCount = 0,
		compareCount = 0
	}: {
		nav: Cat[];
		menu?: MenuNode[];
		searchHints?: string[];
		store: {
			name: string;
			phone: string;
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
		compareCount?: number;
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
					href: `/c/${c.slug}`,
					children: c.children.map((s) => ({ key: s.id, label: s.name, href: `/c/${s.slug}` }))
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
		goto(q.trim() ? `/search?q=${encodeURIComponent(q.trim())}` : '/search');
	}
</script>

<header class="sticky top-0 z-40 bg-surface">
	<!-- Promo bar is a store-wide setting, not a page block — it shows everywhere. -->
	{#if promo?.active && promo.text}
		<PromoBar props={promo} />
	{/if}

	<div class="bg-primary">
		<div class="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
			<button
				class="-ml-1 grid size-10 place-items-center rounded-xl text-white/85 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
				aria-label="Menu"
				onclick={() => (mobileOpen = !mobileOpen)}
			>
				{#if mobileOpen}<X size={20} />{:else}<Menu size={20} />{/if}
			</button>

			<a href="/" class="flex shrink-0 items-center" aria-label={store.name}>
				{#if store.logo?.mode === 'image' && store.logo.image}
					<img src={store.logo.image} alt={store.name} class="h-8 w-auto object-contain" />
				{:else}
					<span class="text-lg font-semibold tracking-tight text-white">
						{store.logo?.text || store.name}
					</span>
				{/if}
			</a>

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
					href="/compare"
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
					href="/account/wishlist"
					class="grid size-10 place-items-center rounded-xl text-white/85 transition-colors hover:bg-white/10 hover:text-white"
					aria-label="Wishlist"
				>
					<Heart size={19} />
				</a>
				<a
					href="/cart"
					class="relative grid size-10 place-items-center rounded-xl text-white/85 transition-colors hover:bg-white/10 hover:text-white"
					aria-label={cartLabel}
				>
					<ShoppingBag size={19} />
				</a>
				<a
					href={customer ? '/account' : '/login'}
					class="flex h-10 items-center gap-2 rounded-xl px-2.5 text-white/85 transition-colors hover:bg-white/10 hover:text-white"
				>
					<User size={19} />
					<span class="hidden text-sm sm:inline">{customer?.name ?? 'Sign in'}</span>
				</a>
			</nav>
		</div>
	</div>

	<!-- category bar with mega menu -->
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
							href="/c/{cat.slug}"
							class="block rounded-xl px-4 py-2.5 text-sm font-medium text-ink"
						>
							{cat.name}
						</a>
						{#each cat.children as sub (sub.id)}
							<a href="/c/{sub.slug}" class="block rounded-xl px-8 py-2 text-sm text-ink-muted">
								{sub.name}
							</a>
						{/each}
					</li>
				{/each}
			</ul>
		</div>
	{/if}
</header>
