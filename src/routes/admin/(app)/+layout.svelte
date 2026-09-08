<script lang="ts">
	import { ChevronUp, Store, Settings, LogOut, ExternalLink } from '@lucide/svelte';
	import { page } from '$app/state';
	import { fade } from 'svelte/transition';
	import { fadeIn } from '$lib/motion';
	import { navGroups, breadcrumbs } from '$lib/nav';
	import Dropdown from '$lib/ui/Dropdown.svelte';
	import MenuItem from '$lib/ui/MenuItem.svelte';
	import Breadcrumbs from '$lib/ui/Breadcrumbs.svelte';
	import NotificationBell from '$lib/ui/NotificationBell.svelte';
	import { SHOP } from '$lib/paths';

	let { data, children } = $props();

	const active = (href: string) =>
		href === '/admin' ? page.url.pathname === '/admin' : page.url.pathname.startsWith(href);

	const crumbs = $derived(breadcrumbs(page.url.pathname));
	const initials = $derived(
		(data.admin?.name ?? '?')
			.split(' ')
			.map((w) => w[0])
			.slice(0, 2)
			.join('')
			.toUpperCase()
	);
</script>

<svelte:head>
	<!-- eslint-disable-next-line svelte/no-at-html-tags -- CSS generated from the theme tokens on the server, not user input -->
	{@html `<style>${data.themeCss}</style>`}
</svelte:head>

<div class="min-h-screen bg-surface-alt">
	<!-- Fixed sidebar + normal document scroll. The previous h-screen shell with an
	     inner scroller let the document scroll past it and show blank space below. -->
	<aside
		class="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border bg-surface md:flex"
	>
		<a href="/admin" class="block px-6 py-5 text-base font-semibold tracking-tight text-ink">
			Store admin
		</a>

		<!-- Grouped nav; scrolls independently so the account menu stays pinned -->
		<nav class="flex-1 overflow-y-auto px-3 pb-4">
			{#each navGroups as group (group.title)}
				<p class="px-3 pt-4 pb-1.5 text-[11px] font-medium tracking-wide text-ink-faint uppercase">
					{group.title}
				</p>
				<ul class="flex flex-col gap-0.5">
					{#each group.items as item (item.href)}
						<li>
							<a
								href={item.href}
								aria-current={active(item.href) ? 'page' : undefined}
								class="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors duration-[180ms] ease-brand
								       {active(item.href)
									? 'bg-primary-soft font-medium text-primary'
									: 'text-ink-muted hover:bg-surface-alt hover:text-ink'}"
							>
								{#if item.icon}
									<item.icon size={16} class="shrink-0" />
								{/if}
								{item.label}
							</a>
						</li>
					{/each}
				</ul>
			{/each}
		</nav>

		<!-- Account — pinned to the bottom, opens upward -->
		<div class="border-t border-border p-3">
			<Dropdown side="top" align="start">
				{#snippet trigger({ open })}
					<span
						class="flex items-center gap-2.5 rounded-xl px-2 py-2 transition-colors duration-[180ms] ease-brand
						       {open ? 'bg-surface-alt' : 'hover:bg-surface-alt'}"
					>
						<span
							class="grid size-8 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-semibold text-primary"
						>
							{initials}
						</span>
						<span class="min-w-0 flex-1 text-left">
							<span class="block truncate text-sm font-medium text-ink">{data.admin?.name}</span>
							<span class="block truncate text-xs text-ink-muted capitalize"
								>{data.admin?.role}</span
							>
						</span>
						<ChevronUp size={16} class="shrink-0 text-ink-faint" />
					</span>
				{/snippet}

				<p class="truncate px-3 py-1.5 text-xs text-ink-muted">{data.admin?.email}</p>
				<div class="my-1 h-px bg-border"></div>
				<MenuItem href="/admin/settings">
					<Settings size={16} />
					Store settings
				</MenuItem>
				<MenuItem href="/">
					<Store size={16} />
					View storefront
				</MenuItem>
				<div class="my-1 h-px bg-border"></div>
				<form method="POST" action="/admin/logout">
					<MenuItem danger>
						<LogOut size={16} />
						Sign out
					</MenuItem>
				</form>
			</Dropdown>
		</div>
	</aside>

	<div class="md:pl-60">
		<header
			class="sticky top-0 z-20 flex h-16 items-center gap-4 bg-surface/70 px-6 backdrop-blur-xl lg:px-8"
		>
			<Breadcrumbs items={crumbs} />
			<div class="ml-auto flex items-center gap-1">
				<a
					href={SHOP}
					target="_blank"
					rel="noopener"
					class="flex h-10 items-center gap-2 rounded-xl px-3 text-sm text-ink-muted transition-colors
					       duration-[180ms] ease-brand hover:bg-surface-alt hover:text-ink"
				>
					<ExternalLink size={16} />
					<span class="hidden sm:inline">Visit site</span>
				</a>
				<NotificationBell notifications={data.notifications} />
			</div>
		</header>
		<main class="min-w-0 px-6 pt-2 pb-16 lg:px-8" in:fade={fadeIn()}>
			{@render children()}
		</main>
	</div>
</div>
