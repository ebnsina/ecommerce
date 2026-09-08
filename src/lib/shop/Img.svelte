<script lang="ts">
	/**
	 * One image element for the whole storefront.
	 *
	 * Product photography here comes from the database as a URL — an upload in
	 * our own storage, or a remote address from an import — so it cannot be
	 * processed at build time the way a bundled asset can. What this does
	 * instead is everything that does not need a build step:
	 *
	 *   - lazy by default, eager only for what is on screen at first paint
	 *   - `decoding="async"`, so a large picture never blocks the paint
	 *   - width and height always set, so nothing shifts as images arrive
	 *   - a `srcset` when the source can resize, so a phone fetches a phone-sized
	 *     picture instead of a 1400px one over mobile data
	 *
	 * ponytail: resizing is by URL convention. Our own uploads and picsum both
	 * take a width; anything else is served as-is. A thumbnail pipeline would
	 * cover the rest — worth it once real shops upload 4MB phone photos.
	 */
	let {
		src,
		alt = '',
		width,
		height,
		/** The one image above the fold — usually a hero. Everything else waits. */
		priority = false,
		sizes,
		class: klass = ''
	}: {
		src: string | null | undefined;
		alt?: string;
		width: number;
		height: number;
		priority?: boolean;
		sizes?: string;
		class?: string;
	} = $props();

	const WIDTHS = [320, 480, 640, 960, 1280];

	/** Sources that answer to a width parameter. */
	function resized(url: string, w: number): string | null {
		// https://picsum.photos/seed/x/700/700 — the last two segments are the size.
		const picsum = url.match(/^(https:\/\/picsum\.photos\/seed\/[^/]+)\/\d+\/\d+$/);
		if (picsum) return `${picsum[1]}/${w}/${Math.round((w * height) / width)}`;
		// Our own storage takes ?w= and ignores it today; harmless, and ready for
		// the day it does not.
		if (url.startsWith('/uploads/')) return `${url}?w=${w}`;
		return null;
	}

	const srcset = $derived(
		src
			? WIDTHS.map((w) => [w, resized(src, w)] as const)
					.filter(([, u]) => u)
					.map(([w, u]) => `${u} ${w}w`)
					.join(', ')
			: ''
	);
</script>

{#if src}
	<img
		{src}
		{alt}
		{width}
		{height}
		srcset={srcset || undefined}
		sizes={srcset ? (sizes ?? '(max-width: 640px) 50vw, 320px') : undefined}
		loading={priority ? 'eager' : 'lazy'}
		fetchpriority={priority ? 'high' : 'auto'}
		decoding="async"
		class={klass}
	/>
{/if}
