<script lang="ts">
	import './marketing.css';
	import { onMount } from 'svelte';

	let { children } = $props();

	/* The bar starts transparent so it sits inside the sunset band, then takes a
	   surface once the hero has scrolled past — otherwise the links land on
	   whatever section happens to be underneath. */
	let scrolled = $state(false);

	onMount(() => {
		const onScroll = () => (scrolled = window.scrollY > 24);
		onScroll();
		window.addEventListener('scroll', onScroll, { passive: true });
		return () => window.removeEventListener('scroll', onScroll);
	});
</script>

<div class="marketing flex min-h-screen flex-col">
	<header
		class="sticky top-0 z-30 transition-colors duration-[180ms] motion-reduce:transition-none"
		style={scrolled
			? 'background: rgb(255 255 255 / 0.92); backdrop-filter: blur(8px); border-bottom: 1px solid var(--m-hairline)'
			: 'background: transparent'}
	>
		<nav
			class="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-4 px-4 sm:px-6"
			aria-label="Main"
		>
			<a href="/" class="display rounded-md text-xl" style="color: var(--m-ink)">CommerceBD</a>

			<div class="hidden items-center gap-7 md:flex">
				{#each [{ href: '#features', label: 'What it does' }, { href: '#pricing', label: 'Pricing' }, { href: '#faq', label: 'Questions' }] as link (link.href)}
					<a
						href={link.href}
						class="rounded-md text-sm font-medium transition-colors duration-[180ms] motion-reduce:transition-none"
						style="color: var(--m-ink)"
					>
						{link.label}
					</a>
				{/each}
			</div>

			<a href="/demo" class="m-btn m-btn-primary text-sm">See the demo</a>
		</nav>
	</header>

	<main class="flex-1">{@render children()}</main>

	<footer style="border-top: 1px solid var(--m-hairline)">
		<div
			class="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-4 px-4 py-8 sm:px-6"
		>
			<p class="text-sm" style="color: var(--m-ink-2)">
				© {new Date().getFullYear()} CommerceBD — ecommerce for Bangladesh.
			</p>
			<ul class="flex flex-wrap gap-6 text-sm" style="color: var(--m-ink-2)">
				<li><a href="#pricing" class="rounded-md">Pricing</a></li>
				<li><a href="#faq" class="rounded-md">Questions</a></li>
				<li><a href="/demo" class="rounded-md">Demo shop</a></li>
			</ul>
		</div>
	</footer>
</div>
