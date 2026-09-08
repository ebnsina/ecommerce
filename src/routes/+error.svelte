<script lang="ts">
	/**
	 * Every error page in the app.
	 *
	 * SvelteKit renders the nearest +error.svelte, and this is the only one, so
	 * it has to speak to a shopper who mistyped a product URL, an owner whose
	 * admin screen fell over, and a crawler — from one file.
	 *
	 * What makes it useful rather than decorative is the way out. A 404 with a
	 * single "go home" button is a dead end for someone who was halfway through
	 * buying something; the links below put them back where they were going.
	 * Which links depends on where they were when it broke.
	 */
	import { page } from '$app/state';
	import { ArrowRight, RotateCw } from '@lucide/svelte';
	import { SHOP, shop } from '$lib/paths';
	import './(marketing)/marketing.css';

	const status = $derived(page.status);
	const inShop = $derived(page.url.pathname.startsWith(SHOP));
	const inAdmin = $derived(page.url.pathname.startsWith('/admin'));

	/* The status line people actually need, not the RFC name for it. A 500 tells
	   the visitor nothing they can act on, so it says what we are doing about
	   it instead. */
	const headline = $derived(
		status === 404
			? 'That page has moved, or never existed.'
			: status === 403
				? 'You are not signed in for this.'
				: status >= 500
					? 'Something broke at our end.'
					: 'That did not work.'
	);

	const body = $derived(
		status === 404
			? inShop
				? 'The product or page you followed is not here any more. It may have sold out and been taken down, or the address may have a typo in it.'
				: 'The address you followed is not a page on this site. It may have moved since the link was made.'
			: status >= 500
				? 'The page failed to load, and the fault is ours rather than yours. It has been logged. Trying again often works, because most of these are momentary.'
				: (page.error?.message ?? 'The page could not be shown.')
	);

	const links = $derived(
		inAdmin
			? [
					{ href: '/admin', label: 'Back to the admin' },
					{ href: '/admin/orders', label: 'Orders' },
					{ href: '/admin/products', label: 'Products' }
				]
			: inShop
				? [
						{ href: shop(), label: 'Back to the shop' },
						{ href: shop('/search'), label: 'Search the catalogue' },
						{ href: shop('/cart'), label: 'Your basket' },
						{ href: shop('/account/orders'), label: 'Track an order' }
					]
				: [
						{ href: '/', label: 'Back to the front page' },
						{ href: '/#pricing', label: 'Pricing' },
						{ href: '/#faq', label: 'Questions' },
						{ href: shop(), label: 'The demo shop' }
					]
	);
</script>

<svelte:head>
	<title>{status} — {headline}</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="marketing flex min-h-screen flex-col">
	<main class="mesh relative isolate flex flex-1 items-center overflow-hidden">
		<div class="mx-auto w-full max-w-2xl px-4 py-24 sm:px-6">
			<p class="num text-sm font-semibold text-primary">Error {status}</p>

			<h1 class="display mt-4 text-[clamp(2rem,5.5vw,3.5rem)] text-ink">{headline}</h1>

			<p class="mt-5 max-w-xl text-base text-ink-muted">{body}</p>

			<div class="mt-9 flex flex-wrap gap-3">
				<a
					href={links[0].href}
					class="flex h-14 items-center gap-2 rounded-xl bg-primary px-8 text-[0.9375rem] font-medium text-white
					       transition-colors duration-[180ms] ease-brand hover:bg-primary-hover motion-reduce:transition-none"
				>
					{links[0].label}
					<ArrowRight size={17} />
				</a>

				{#if status >= 500}
					<!-- A full reload rather than a client-side navigation: whatever
					     failed may have left the page's own state behind. -->
					<a
						href={page.url.pathname}
						data-sveltekit-reload
						class="flex h-14 items-center gap-2 rounded-xl border border-border bg-surface px-8 text-[0.9375rem] font-medium text-ink
						       transition-colors duration-[180ms] ease-brand hover:border-brand-300 motion-reduce:transition-none"
					>
						<RotateCw size={16} />
						Try again
					</a>
				{/if}
			</div>

			<div class="mt-14 border-t border-border pt-6">
				<p class="text-xs font-semibold tracking-wide text-ink-muted uppercase">Or go to</p>
				<ul class="mt-4 flex flex-wrap gap-x-8 gap-y-3">
					{#each links.slice(1) as link (link.href)}
						<li>
							<a
								href={link.href}
								class="rounded-lg text-sm text-ink-muted transition-colors duration-[180ms] ease-brand hover:text-ink motion-reduce:transition-none"
							>
								{link.label}
							</a>
						</li>
					{/each}
				</ul>
			</div>
		</div>
	</main>
</div>
