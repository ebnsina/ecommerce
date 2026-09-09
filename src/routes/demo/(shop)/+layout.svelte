<script lang="ts">
	import Header from '$lib/shop/Header.svelte';
	import Footer from '$lib/shop/Footer.svelte';
	import Pixels from '$lib/shop/Pixels.svelte';
	import AskButton from '$lib/shop/AskButton.svelte';
	import LayoutSwitcher from '$lib/shop/LayoutSwitcher.svelte';
	import CategoryRail from '$lib/shop/CategoryRail.svelte';
	import BasketPanel from '$lib/shop/BasketPanel.svelte';
	import { layoutOf } from '$lib/layouts';
	import { page } from '$app/state';
	import { SHOP } from '$lib/paths';
	import '$lib/shop/layouts.css';

	let { data, children } = $props();

	const shape = $derived(layoutOf(data.layout));

	const path = $derived(page.url.pathname);
	const onShelf = $derived(
		path === SHOP || path.startsWith(`${SHOP}/c/`) || path.startsWith(`${SHOP}/search`)
	);

	/* The rail belongs beside a shelf, not beside a form: the front page and the
	   category pages, where a shopper is still choosing an aisle. Search brings
	   its own sidebar of filters, and two columns of navigation either side of
	   the results is one too many. */
	const showRail = $derived(!!shape.rail && (path === SHOP || path.startsWith(`${SHOP}/c/`)));

	/* The basket stands wherever there is shopping to do — but not beside the
	   cart page, which is the same list twice. */
	const showBasket = $derived(shape.basket && onShelf);
	/* Window-height, three columns, no page scroll. */
	const appShell = $derived(showBasket);
</script>

<!-- Theme variables land in the head, so a change in Settings re-themes every
     page at once with no rebuild. -->
<svelte:head>
	<!-- eslint-disable-next-line svelte/no-at-html-tags -- CSS generated from the theme tokens on the server, not user input -->
	{@html `<style>${data.themeCss}</style>`}
</svelte:head>

<Pixels ids={data.settings.analytics ?? {}} />

<!-- A grocery shelf is an app screen, not a document: the window is the height,
     the middle scrolls, and the rail and the basket stay put without a single
     sticky offset to keep in step with the header. Everything else — every
     other layout, and every other page of this one — is a page that scrolls,
     footer and all. -->
<div
	class="flex flex-col bg-page {shape.shell} {appShell
		? 'h-screen overflow-hidden'
		: 'min-h-screen'}"
>
	<Header
		chrome={shape.header}
		categoriesButton={!showRail}
		nav={data.nav}
		menu={data.menus.header ?? []}
		store={data.settings.store}
		promo={data.settings.promo}
		customer={data.customer}
		cartCount={data.cartCount}
		cartSubtotal={data.cartSubtotal}
		compareCount={data.compareIds.length}
		wishlistCount={data.wishlistIds.length}
		searchHints={data.settings.search?.hints ?? []}
	/>
	{#if showRail || showBasket}
		<!-- An app shell, not a page with columns bolted on: the aisles stand at
		     the left, the basket is a sheet at the right, and both keep still
		     while the middle scrolls. A grocery shop is worked, not read. -->
		<div class="flex gap-4 {appShell ? 'min-h-0 flex-1' : 'mx-auto w-full max-w-7xl flex-1 px-4'}">
			{#if showRail}
				<CategoryRail nav={data.nav} style={shape.rail || 'plain'} scrolls={appShell} />
			{/if}
			<main class="min-w-0 flex-1 {appShell ? 'overflow-y-auto px-3' : ''}">
				{@render children()}
			</main>
			{#if showBasket}
				<BasketPanel lines={data.cartLines} items={data.cartItems} subtotal={data.cartSubtotal} />
			{/if}
		</div>
	{:else}
		<main class="flex-1">{@render children()}</main>
	{/if}

	<AskButton />
	<LayoutSwitcher current={data.layout} />
	{#if !appShell}
		<Footer
			store={data.settings.store}
			social={data.settings.social}
			nav={data.nav}
			menu={data.menus.footer ?? []}
			paymentMethods={data.settings.footer?.paymentMethods ?? []}
			assurances={data.settings.assurances ?? []}
		/>
	{/if}
</div>
