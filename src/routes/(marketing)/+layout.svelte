<script lang="ts">
	import { DEFAULT_THEME, themeCss } from '$lib/theme';

	let { children } = $props();

	/* Same injection as the shop layout — a style element in the head — but from
	   the default preset rather than the database, so this route needs no query. */
	const css = themeCss(DEFAULT_THEME);
</script>

<svelte:head>
	{@html `<style>${css}</style>`}
</svelte:head>

<div class="flex min-h-screen flex-col bg-page">
	<header class="sticky top-0 z-20 border-b border-border bg-surface/90 backdrop-blur">
		<div class="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
			<a
				href="/"
				class="rounded-lg text-base font-semibold tracking-tight text-ink"
				aria-label="Store platform, home"
			>
				Store
			</a>
			<a
				href="/demo"
				class="rounded-lg text-sm font-medium text-primary transition-colors duration-[180ms] ease-brand hover:text-primary-hover"
			>
				See the demo
			</a>
		</div>
	</header>

	<main class="flex-1">{@render children()}</main>

	<footer class="border-t border-border">
		<div
			class="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-ink-muted sm:flex-row sm:items-center sm:justify-between sm:px-6"
		>
			<p>Store — an ecommerce platform for Bangladeshi shops.</p>
			<nav aria-label="Footer">
				<ul class="flex gap-5">
					<li><a href="/#pricing" class="rounded-lg hover:text-ink">Pricing</a></li>
					<li><a href="/#faq" class="rounded-lg hover:text-ink">FAQ</a></li>
					<li><a href="/demo" class="rounded-lg hover:text-ink">Demo shop</a></li>
				</ul>
			</nav>
		</div>
	</footer>
</div>
