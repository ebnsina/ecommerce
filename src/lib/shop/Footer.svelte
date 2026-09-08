<script lang="ts">
	// Deep imports — the barrel pulls ~3,000 .svelte files through SSR.
	import SiFacebook from '@icons-pack/svelte-simple-icons/icons/SiFacebook';
	import SiInstagram from '@icons-pack/svelte-simple-icons/icons/SiInstagram';
	import SiYoutube from '@icons-pack/svelte-simple-icons/icons/SiYoutube';
	import { Phone, Mail, Clock } from '@lucide/svelte';
	import { assuranceIcon } from '$lib/assuranceIcons';
	import { formatPhone } from '$lib/phone';

	type MenuNode = { label: string; href: string; children?: MenuNode[] };
	type PaymentBadge = { name: string; logo?: string } | string;

	let {
		store,
		social,
		nav,
		menu = [],
		paymentMethods = [],
		assurances = [],
		note = ''
	}: {
		store: { name: string; phone: string; email: string; supportHours?: string };
		social: { facebook: string; instagram: string; youtube: string };
		nav: { id: string; name: string; slug: string }[];
		menu?: MenuNode[];
		paymentMethods?: PaymentBadge[];
		assurances?: { icon: string; title: string; note: string }[];
		note?: string;
	} = $props();

	/* Columns come only from the footer menu — one source of truth, editable in
	   Menus. Seeded with sensible defaults on first run. */
	const columns = $derived(
		menu.map((m) => ({
			title: m.label,
			links: (m.children ?? []).map((c) => ({ label: c.label, href: c.href }))
		}))
	);

	/* Badges were plain labels before logos were allowed; both shapes render. */
	const badges = $derived(
		paymentMethods.map((m) => (typeof m === 'string' ? { name: m, logo: '' } : m))
	);

	/* Categories are the densest, most useful thing a shopper can be given down
	   here — it is where they land after reading a policy page. */
	const shopLinks = $derived(nav.slice(0, 8));
</script>

<footer class="mt-16 border-t border-border bg-surface-alt">
	<!-- The same reassurances the product page shows, written once in Settings. -->
	{#if assurances.length}
		<div class="border-b border-border">
			<div class="mx-auto grid max-w-7xl gap-4 px-4 py-8 sm:grid-cols-2 lg:grid-cols-4">
				{#each assurances as a (a.title)}
					{@const Icon = assuranceIcon(a.icon)}
					<div class="flex items-start gap-3">
						<span
							class="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary"
						>
							<Icon size={18} />
						</span>
						<span>
							<span class="block text-sm font-medium text-ink">{a.title}</span>
							<span class="block text-xs text-ink-muted">{a.note}</span>
						</span>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<div class="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-5">
		<div class="lg:col-span-2">
			<p class="text-lg font-semibold tracking-tight text-ink">{store.name}</p>

			<dl class="mt-4 flex flex-col gap-3">
				{#if store.phone}
					<div class="flex items-center gap-3">
						<dt
							class="grid size-9 shrink-0 place-items-center rounded-xl border border-border bg-surface text-ink-muted"
						>
							<Phone size={16} />
							<span class="sr-only">Phone</span>
						</dt>
						<dd>
							<a
								href="tel:{store.phone}"
								class="num block font-semibold text-ink hover:text-primary"
							>
								{formatPhone(store.phone)}
							</a>
							{#if store.supportHours}
								<span class="block text-xs text-ink-muted">{store.supportHours}</span>
							{/if}
						</dd>
					</div>
				{/if}
				{#if store.email}
					<div class="flex items-center gap-3">
						<dt
							class="grid size-9 shrink-0 place-items-center rounded-xl border border-border bg-surface text-ink-muted"
						>
							<Mail size={16} />
							<span class="sr-only">Email</span>
						</dt>
						<dd>
							<a href="mailto:{store.email}" class="block text-sm text-ink hover:text-primary">
								{store.email}
							</a>
						</dd>
					</div>
				{/if}
				{#if store.supportHours}
					<div class="flex items-center gap-3">
						<dt
							class="grid size-9 shrink-0 place-items-center rounded-xl border border-border bg-surface text-ink-muted"
						>
							<Clock size={16} />
							<span class="sr-only">Opening hours</span>
						</dt>
						<dd class="text-sm text-ink-muted">{store.supportHours}</dd>
					</div>
				{/if}
			</dl>

			<div class="mt-5 flex gap-2">
				{#each [{ href: social.facebook, Icon: SiFacebook, label: 'Facebook' }, { href: social.instagram, Icon: SiInstagram, label: 'Instagram' }, { href: social.youtube, Icon: SiYoutube, label: 'YouTube' }] as s (s.label)}
					{#if s.href}
						<a
							href={s.href}
							aria-label={s.label}
							class="grid size-9 place-items-center rounded-xl bg-primary text-white transition-colors hover:bg-primary-hover"
						>
							<s.Icon size={16} />
						</a>
					{/if}
				{/each}
			</div>
		</div>

		{#if shopLinks.length}
			<div>
				<p class="text-xs font-semibold tracking-wide text-ink uppercase">Shop</p>
				<ul class="mt-4 flex flex-col gap-2.5">
					{#each shopLinks as c (c.id)}
						<li>
							<a
								href="/c/{c.slug}"
								class="text-sm text-ink-muted transition-colors hover:text-primary"
							>
								{c.name}
							</a>
						</li>
					{/each}
				</ul>
			</div>
		{/if}

		{#each columns as col (col.title)}
			<div>
				<p class="text-xs font-semibold tracking-wide text-ink uppercase">{col.title}</p>
				<ul class="mt-4 flex flex-col gap-2.5">
					{#each col.links as link (link.href)}
						<li>
							<a
								href={link.href}
								class="text-sm text-ink-muted transition-colors hover:text-primary"
							>
								{link.label}
							</a>
						</li>
					{/each}
				</ul>
			</div>
		{/each}
	</div>

	{#if badges.length}
		<div class="border-t border-border">
			<div class="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-4 py-6">
				<span class="text-xs font-semibold tracking-wide text-ink uppercase">We accept</span>
				<ul class="flex flex-wrap items-center gap-2">
					{#each badges as m (m.name)}
						<li
							class="flex h-9 items-center gap-2 rounded-xl border border-border bg-surface px-3"
							title={m.name}
						>
							{#if m.logo}
								<!-- The label stays as the accessible name; the logo is the picture of it. -->
								<img src={m.logo} alt={m.name} class="h-5 w-auto max-w-16 object-contain" />
							{:else}
								<span class="text-xs font-medium text-ink">{m.name}</span>
							{/if}
						</li>
					{/each}
				</ul>
			</div>
		</div>
	{/if}

	<div class="border-t border-border">
		<div
			class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-5 text-xs text-ink-muted"
		>
			<p>© {new Date().getFullYear()} {store.name}. All rights reserved.</p>
			{#if note}<p>{note}</p>{/if}
		</div>
	</div>
</footer>
