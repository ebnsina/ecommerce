<script lang="ts">
	import { page } from '$app/state';
	import { User, Package, Heart, MapPin, LogOut } from '@lucide/svelte';
	import { formatPhone } from '$lib/phone';

	let { data, children } = $props();

	const links = [
		{ href: '/account', label: 'Overview', Icon: User },
		{ href: '/account/orders', label: 'My orders', Icon: Package },
		{ href: '/account/wishlist', label: 'Wishlist', Icon: Heart },
		{ href: '/account/addresses', label: 'Addresses', Icon: MapPin }
	];

	const active = (href: string) =>
		href === '/account' ? page.url.pathname === '/account' : page.url.pathname.startsWith(href);
</script>

<div class="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[16rem_1fr]">
	<aside class="h-fit rounded-3xl border border-border bg-surface p-3">
		<div class="px-3 py-3">
			<p class="text-sm font-medium text-ink">{data.me.name ?? 'Welcome'}</p>
			<p class="num text-xs text-ink-muted">{formatPhone(data.me.phone)}</p>
		</div>
		<nav class="flex flex-col gap-0.5">
			{#each links as l (l.href)}
				<a
					href={l.href}
					aria-current={active(l.href) ? 'page' : undefined}
					class="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors duration-[180ms] ease-brand
					       {active(l.href)
						? 'bg-primary-soft font-medium text-primary'
						: 'text-ink-muted hover:bg-surface-alt hover:text-ink'}"
				>
					<l.Icon size={16} />
					{l.label}
				</a>
			{/each}
		</nav>
		<form method="POST" action="/logout" class="mt-2 border-t border-border pt-2">
			<button
				class="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-ink-muted transition-colors hover:text-sale"
			>
				<LogOut size={16} />
				Sign out
			</button>
		</form>
	</aside>

	<div class="min-w-0">{@render children()}</div>
</div>
