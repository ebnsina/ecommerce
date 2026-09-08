<script lang="ts">
	import './marketing.css';
	import { onMount } from 'svelte';
	import { ArrowRight } from '@lucide/svelte';

	let { children } = $props();

	/* Transparent over the hero wash, then a surface with a hairline once the
	   page moves — so the bar never sits on top of content it does not own. */
	let scrolled = $state(false);

	onMount(() => {
		const onScroll = () => (scrolled = window.scrollY > 16);
		onScroll();
		window.addEventListener('scroll', onScroll, { passive: true });
		return () => window.removeEventListener('scroll', onScroll);
	});
</script>

<div class="marketing flex min-h-screen flex-col">
	<header
		class="sticky top-0 z-30 transition-[background-color,border-color] duration-[180ms] ease-brand motion-reduce:transition-none
		       {scrolled
			? 'border-b border-border bg-surface/80 backdrop-blur-md'
			: 'border-b border-transparent'}"
	>
		<nav
			class="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6"
			aria-label="Main"
		>
			<a href="/" class="rounded-lg text-[0.9375rem] font-semibold tracking-tight text-ink">
				CommerceBD
			</a>

			<div class="hidden items-center gap-8 md:flex">
				{#each [{ href: '#features', label: 'Product' }, { href: '#pricing', label: 'Pricing' }, { href: '#faq', label: 'Questions' }] as link (link.href)}
					<a
						href={link.href}
						class="rounded-lg text-sm text-ink-muted transition-colors duration-[180ms] ease-brand hover:text-ink motion-reduce:transition-none"
					>
						{link.label}
					</a>
				{/each}
			</div>

			<a
				href="/demo"
				class="flex h-9 items-center gap-1.5 rounded-xl bg-ink px-4 text-sm font-medium text-white
				       transition-colors duration-[180ms] ease-brand hover:bg-primary motion-reduce:transition-none"
			>
				See the demo
				<ArrowRight size={15} />
			</a>
		</nav>
	</header>

	<main class="flex-1">{@render children()}</main>

	<footer class="border-t border-border">
		<div
			class="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-10 sm:px-6"
		>
			<p class="text-sm text-ink-muted">
				© {new Date().getFullYear()} CommerceBD — ecommerce for Bangladesh.
			</p>
			<ul class="flex flex-wrap gap-6 text-sm text-ink-muted">
				<li><a href="#pricing" class="rounded-lg hover:text-ink">Pricing</a></li>
				<li><a href="#faq" class="rounded-lg hover:text-ink">Questions</a></li>
				<li><a href="/demo" class="rounded-lg hover:text-ink">Demo shop</a></li>
			</ul>
		</div>
	</footer>
</div>
