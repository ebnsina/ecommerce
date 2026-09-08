<script lang="ts">
	import Header from '$lib/shop/Header.svelte';
	import Footer from '$lib/shop/Footer.svelte';

	let { data, children } = $props();
</script>

<!-- Theme variables land in the head, so a change in Settings re-themes every
     page at once with no rebuild. -->
<svelte:head>
	{@html `<style>${data.themeCss}</style>`}
</svelte:head>

<div class="flex min-h-screen flex-col">
	<Header
		nav={data.nav}
		menu={data.menus.header ?? []}
		store={data.settings.store}
		promo={data.settings.promo}
		customer={data.customer}
		cartCount={data.cartCount}
		compareCount={data.compareIds.length}
		searchHints={data.settings.search?.hints ?? []}
	/>
	<main class="flex-1">{@render children()}</main>
	<Footer
		store={data.settings.store}
		social={data.settings.social}
		nav={data.nav}
		menu={data.menus.footer ?? []}
		paymentMethods={data.settings.footer?.paymentMethods ?? []}
		note={data.settings.footer?.note ?? ''}
	/>
</div>
