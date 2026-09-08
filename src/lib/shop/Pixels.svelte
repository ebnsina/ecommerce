<script lang="ts">
	import { page } from '$app/state';
	import { bootPixels, trackPage, type PixelIds } from '$lib/track';

	/**
	 * Loads every ad platform switched on in Settings. Renders nothing.
	 *
	 * The scripts are loaded from an effect rather than <svelte:head>, because a
	 * head script only runs on the first server-rendered page — after that the
	 * shopper navigates client-side and nothing would fire.
	 */
	let { ids }: { ids: PixelIds } = $props();

	$effect(() => {
		bootPixels(ids);
	});

	// One page view per navigation, client-side ones included. A form action
	// re-runs the load and replaces `page` without the path changing, so the
	// path itself — not the effect firing — is what counts as a new view.
	let seen = $state('');
	$effect(() => {
		if (seen === page.url.pathname) return;
		seen = page.url.pathname;
		trackPage();
	});
</script>

<svelte:head>
	{#if ids.metaPixelId}
		<!-- Meta's no-JavaScript fallback is the only part that must be in markup. -->
		{@html `<noscript><img height="1" width="1" style="display:none" alt=""
			src="https://www.facebook.com/tr?id=${encodeURIComponent(ids.metaPixelId)}&ev=PageView&noscript=1" /></noscript>`}
	{/if}
</svelte:head>

{#if ids.gtmId}
	<!-- Tag Manager's fallback for visitors without JavaScript. It has to live in
	     the body, so it is rendered here rather than in the head above. -->
	{@html `<noscript><iframe title="Google Tag Manager"
		src="https://www.googletagmanager.com/ns.html?id=${encodeURIComponent(ids.gtmId)}"
		height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>`}
{/if}
