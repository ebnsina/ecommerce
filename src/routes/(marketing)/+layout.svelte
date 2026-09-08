<script lang="ts">
	import './marketing.css';
	import {
		ArrowRight,
		Home,
		Compass,
		Layers,
		Plug,
		Tag,
		MessageCircleQuestion,
		Brain,
		Heart
	} from '@lucide/svelte';
	import { integrations } from './integrations';

	let { children } = $props();

	/* In-page links scroll rather than jump, and do not leave a hash in the
	   address bar — the dock is a table of contents, not six separate URLs.
	   The href stays put, so the links still work with JavaScript off and still
	   announce as links. Focus moves with the scroll, or a keyboard reader
	   would be left behind at the top of the page. */
	function scrollToSection(event: MouseEvent) {
		if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey) return;

		const link = (event.target as Element | null)?.closest?.('a[href^="#"]');
		if (!(link instanceof HTMLAnchorElement)) return;

		const target = document.getElementById(link.hash.slice(1));
		if (!target) return;

		event.preventDefault();

		/* Focus first. Moving focus mid-flight cancels a smooth scroll in
		   Chrome, so the section is made focusable and focused before the
		   scroll is asked for, not after. */
		target.setAttribute('tabindex', '-1');
		target.focus({ preventScroll: true });

		const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
	}

	/* Two columns of quick links beside the wide brand block — the shape every
	   footer has, because it is the shape people already know how to read. */
	const columns = [
		{
			head: 'Product',
			items: [
				{ href: '#features', label: 'How it works' },
				{ href: '#assistant', label: 'The assistant' },
				{ href: '#integrations', label: 'Integrations' },
				{ href: '#pricing', label: 'Pricing' },
				{ href: '/demo', label: 'Demo shop' }
			]
		},
		{
			head: 'Support',
			items: [
				{ href: '#problem', label: 'Why this exists' },
				{ href: '#faq', label: 'Questions' },
				{ href: '#faq', label: 'Running it yourself' },
				{ href: '/demo/pages/contact', label: 'Talk to us' }
			]
		}
	];

	/* The dock. Six places to go and one thing to do, in the order the page
	   tells its story — so the dock doubles as a table of contents. */
	const dock = [
		{ href: '#top', label: 'Top', Icon: Home },
		{ href: '#problem', label: 'Why', Icon: Compass },
		{ href: '#features', label: 'Product', Icon: Layers },
		{ href: '#assistant', label: 'Assistant', Icon: Brain },
		{ href: '#integrations', label: 'Integrations', Icon: Plug },
		{ href: '#pricing', label: 'Pricing', Icon: Tag },
		{ href: '#faq', label: 'Questions', Icon: MessageCircleQuestion }
	];
</script>

<svelte:document onclick={scrollToSection} />

<div class="marketing relative flex min-h-screen flex-col">
	<!-- The bar stops being sticky now that the menu lives at the bottom, and it
	     sits over the hero rather than above it, so the wash behind the headline
	     runs unbroken to the top of the window. -->
	<!-- Just the wordmark, centred. The dock at the bottom carries the menu and
	     the demo, so a second button up here was saying the same thing twice. -->
	<header class="absolute inset-x-0 top-0 z-20">
		<div class="mx-auto flex h-20 max-w-6xl items-center justify-center px-4 sm:px-6">
			<a href="/" class="flex items-center gap-2.5 rounded-lg">
				<span
					class="grid size-8 place-items-center rounded-xl bg-primary text-sm font-semibold text-white"
					aria-hidden="true">D</span
				>
				<span class="wordmark text-[1.125rem] text-ink">Dukkan</span>
			</a>
		</div>
	</header>

	<main class="flex-1">{@render children()}</main>

	<!-- ── The footer, over a real shop ──────────────────────────────────────
	     A photograph of the thing being sold to, under a wash dark enough that
	     every line on top of it clears contrast against the darkest stop. The
	     oversized wordmark at the bottom is the one place the display face is
	     allowed to be purely decorative. -->
	<!-- ── The footer ───────────────────────────────────────────────────────
	     Links on white where they read best, a rule, the small print, and then
	     the picture full width as the last thing on the page. Nothing is set on
	     top of the artwork, so it needs no overlay and no contrast floor; its
	     own sky is white at the top, which is what joins it to the page. -->
	<footer class="overflow-hidden rounded-t-[3rem] bg-surface">
		<div class="mx-auto max-w-6xl px-4 pt-16 sm:px-6">
			<div class="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
				<!-- The wide one: who this is, and what it plugs into. Those are the
				     services the product connects to, not accounts we run — putting
				     social icons here for accounts that do not exist would be the
				     one lie on an otherwise honest page. -->
				<div class="lg:col-span-2">
					<a href="/" class="flex items-center gap-2.5 rounded-lg">
						<span
							class="grid size-8 place-items-center rounded-xl bg-primary text-sm font-semibold text-white"
							aria-hidden="true">D</span
						>
						<span class="wordmark text-[1.125rem] text-ink">Dukkan</span>
					</a>
					<p class="mt-4 max-w-sm text-sm text-ink-muted">
						Ecommerce for Bangladesh. Cash on delivery, Steadfast and Pathao dispatch, every message
						channel in one inbox, and a storefront the owner edits.
					</p>

					<!-- All twelve, not six and a sentence listing the rest. The five
					     without a logo file carry a monogram, the same as the section
					     on the page. -->
					<p class="mt-8 text-xs font-semibold tracking-wide text-ink uppercase">Integrations</p>
					<ul class="mt-3 flex flex-wrap gap-2">
						{#each integrations as item (item.name)}
							<li
								class="grid size-9 place-items-center rounded-xl border border-border"
								title={item.name}
							>
								{#if item.logo}
									<img src={item.logo} alt={item.name} width="17" height="17" loading="lazy" />
								{:else}
									<span class="text-[0.6875rem] font-semibold text-ink-muted">
										{item.name.slice(0, 2)}
									</span>
								{/if}
							</li>
						{/each}
					</ul>
				</div>

				{#each columns as col (col.head)}
					<div>
						<p class="text-xs font-semibold tracking-wide text-ink uppercase">{col.head}</p>
						<ul class="mt-4 flex flex-col gap-3">
							{#each col.items as item (item.label)}
								<li>
									<a
										href={item.href}
										class="rounded-lg text-sm text-ink-muted transition-colors duration-[180ms] ease-brand hover:text-ink motion-reduce:transition-none"
									>
										{item.label}
									</a>
								</li>
							{/each}
						</ul>
					</div>
				{/each}
			</div>

			<div
				class="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-border py-6 text-sm text-ink-muted"
			>
				<p>© {new Date().getFullYear()} Dukkan</p>
				<p class="flex items-center gap-1.5">
					<Heart size={13} class="text-sale" aria-hidden="true" />
					Built with love in Bangladesh
				</p>
			</div>

			<!-- The picture credits. Small and quiet, because nobody came here to
			     read them — but not invisible: the Nilgiri photograph is CC BY-SA,
			     which asks for attribution that a reader can actually find. Muted
			     rather than faint, so it still clears 4.5:1. -->
			<p class="pb-6 text-[0.6875rem] text-ink-muted">
				Nilgiri photograph by Tanvir Rahat,
				<a href="https://creativecommons.org/licenses/by-sa/4.0/" class="rounded underline">
					CC BY-SA 4.0
				</a>. Haor photograph from Unsplash.
			</p>
		</div>

		<img
			src="/img/footer-scene.jpg"
			alt=""
			class="band"
			width="2400"
			height="1350"
			loading="lazy"
		/>
	</footer>

	<nav class="dock" aria-label="Main">
		{#each dock as item (item.href)}
			<a href={item.href} class="dock-item">
				<item.Icon size={20} aria-hidden="true" />
				<span class="dock-label">{item.label}</span>
			</a>
		{/each}

		<span class="dock-sep" aria-hidden="true"></span>

		<a href="/demo" class="dock-item">
			<ArrowRight size={20} aria-hidden="true" />
			<span class="dock-label">Demo</span>
		</a>
	</nav>
</div>
