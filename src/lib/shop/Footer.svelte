<script lang="ts">
	// Deep imports — the barrel pulls ~3,000 .svelte files through SSR.
	import SiFacebook from '@icons-pack/svelte-simple-icons/icons/SiFacebook';
	import SiInstagram from '@icons-pack/svelte-simple-icons/icons/SiInstagram';
	import SiYoutube from '@icons-pack/svelte-simple-icons/icons/SiYoutube';

	type MenuNode = { label: string; href: string; children?: MenuNode[] };

	let {
		store,
		social,
		nav,
		menu = [],
		paymentMethods = [],
		note = ''
	}: {
		store: { name: string; phone: string; email: string; supportHours?: string };
		social: { facebook: string; instagram: string; youtube: string };
		nav: { id: string; name: string; slug: string }[];
		menu?: MenuNode[];
		paymentMethods?: string[];
		note?: string;
	} = $props();

	/* Saved footer menu wins; the default columns keep a new store presentable. */
	/* Columns come only from the footer menu — one source of truth, editable in
	   Menus. Seeded with sensible defaults on first run. */
	const columns = $derived(
		menu.map((m) => ({
			title: m.label,
			links: (m.children ?? []).map((c) => ({ label: c.label, href: c.href }))
		}))
	);
</script>

<footer class="mt-16">
	<div class="border-t border-border bg-surface-alt">
		<div class="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
			<div>
				<p class="text-lg font-semibold tracking-tight text-ink">{store.name}</p>
				{#if store.phone}
					{#if store.supportHours}
						<p class="mt-3 text-sm text-ink-muted">{store.supportHours}</p>
					{/if}
					<a href="tel:{store.phone}" class="num mt-1 block text-lg font-semibold text-ink">
						{store.phone}
					</a>
				{/if}
				<div class="mt-4 flex gap-2">
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

		<div class="border-t border-border">
			<div
				class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-5 text-xs text-ink-muted"
			>
				<p>© {new Date().getFullYear()} {store.name}. All rights reserved.</p>
				<p class="flex flex-wrap items-center gap-2">
					<span>We accept</span>
					{#each paymentMethods as m (m)}
						<span class="rounded-lg border border-border bg-surface px-2 py-1">{m}</span>
					{/each}
				</p>
			</div>
		</div>
	</div>
</footer>
