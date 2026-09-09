<script lang="ts">
	import Header from '$lib/shop/Header.svelte';
	import Footer from '$lib/shop/Footer.svelte';
	import Pixels from '$lib/shop/Pixels.svelte';
	import AskButton from '$lib/shop/AskButton.svelte';
	import LayoutSwitcher from '$lib/shop/LayoutSwitcher.svelte';
	import CategoryRail from '$lib/shop/CategoryRail.svelte';
	import { layoutOf } from '$lib/layouts';
	import '$lib/shop/layouts.css';

	let { data, children } = $props();

	const shape = $derived(layoutOf(data.layout));
</script>

<!-- Theme variables land in the head, so a change in Settings re-themes every
     page at once with no rebuild. -->
<svelte:head>
	<!-- eslint-disable-next-line svelte/no-at-html-tags -- CSS generated from the theme tokens on the server, not user input -->
	{@html `<style>${data.themeCss}</style>`}
</svelte:head>

<Pixels ids={data.settings.analytics ?? {}} />

<div class="flex min-h-screen flex-col bg-page {shape.shell}">
	<Header
		chrome={shape.header}
		nav={data.nav}
		menu={data.menus.header ?? []}
		store={data.settings.store}
		promo={data.settings.promo}
		customer={data.customer}
		cartCount={data.cartCount}
		compareCount={data.compareIds.length}
		searchHints={data.settings.search?.hints ?? []}
	/>
	{#if shape.rail}
		<!-- The categories as a standing list rather than a menu that opens. A
		     grocer and a parts dealer both navigate this way, because their
		     shoppers arrive knowing the aisle. -->
		<div class="mx-auto flex w-full max-w-7xl flex-1 gap-6 px-4">
			<CategoryRail nav={data.nav} />
			<main class="min-w-0 flex-1">{@render children()}</main>
		</div>
	{:else}
		<main class="flex-1">{@render children()}</main>
	{/if}
	<AskButton />
	<LayoutSwitcher current={data.layout} />
	<Footer
		store={data.settings.store}
		social={data.settings.social}
		nav={data.nav}
		menu={data.menus.footer ?? []}
		paymentMethods={data.settings.footer?.paymentMethods ?? []}
		assurances={data.settings.assurances ?? []}
		note={data.settings.footer?.note ?? ''}
	/>
</div>
