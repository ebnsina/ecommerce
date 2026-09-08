<script lang="ts">
	import { page } from '$app/state';

	/**
	 * Meta Pixel. Renders nothing; only runs when a pixel ID is set in Settings.
	 *
	 * The base snippet is loaded from an effect rather than a <svelte:head>
	 * script tag, because head scripts only run on the first server-rendered
	 * page — after that the shopper navigates client-side and nothing fires.
	 */
	let { pixelId }: { pixelId: string } = $props();

	function fbq(...args: unknown[]) {
		(window as any).fbq?.(...args);
	}

	$effect(() => {
		if (!pixelId || (window as any).fbq) return;
		const q: any = ((window as any).fbq = function (...args: unknown[]) {
			q.callMethod ? q.callMethod.apply(q, args) : q.queue.push(args);
		});
		(window as any)._fbq ??= q;
		q.push = q;
		q.loaded = true;
		q.version = '2.0';
		q.queue = [];
		const s = document.createElement('script');
		s.async = true;
		s.src = 'https://connect.facebook.net/en_US/fbevents.js';
		document.head.appendChild(s);
		fbq('init', pixelId);
	});

	// One PageView per navigation, including client-side ones.
	$effect(() => {
		page.url.pathname;
		if (pixelId) fbq('track', 'PageView');
	});
</script>

<svelte:head>
	{#if pixelId}
		<!-- The <noscript> fallback is the only part Meta needs in markup. -->
		{@html `<noscript><img height="1" width="1" style="display:none" alt=""
			src="https://www.facebook.com/tr?id=${encodeURIComponent(pixelId)}&ev=PageView&noscript=1" /></noscript>`}
	{/if}
</svelte:head>
