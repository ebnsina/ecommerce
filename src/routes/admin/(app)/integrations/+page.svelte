<script lang="ts">
	import { Check, Plug, Copy, Search, X } from '@lucide/svelte';
	import ChannelBadge from '$lib/admin/ChannelBadge.svelte';
	import PageHeader from '$lib/admin/PageHeader.svelte';

	let { data } = $props();

	/* Browsing state only — a catalogue of this size is already on the page, so
	   filtering it over the network would be slower and no more correct. */
	let category = $state('');
	let onlyMissing = $state(false);
	let q = $state('');
	let copied = $state('');

	const CHANNEL_KEYS = new Set(['site', 'sms', 'telegram', 'whatsapp', 'messenger', 'instagram']);

	const shown = $derived(
		data.items.filter(
			(i) =>
				(!category || i.category === category) &&
				(!onlyMissing || !i.connected) &&
				(!q.trim() ||
					`${i.name} ${i.purpose} ${i.category}`.toLowerCase().includes(q.trim().toLowerCase()))
		)
	);

	async function copy(text: string, key: string) {
		await navigator.clipboard.writeText(text);
		copied = key;
		setTimeout(() => (copied = ''), 1500);
	}

	const clear = () => {
		category = '';
		onlyMissing = false;
		q = '';
	};
</script>

<svelte:head><title>Integrations · Admin</title></svelte:head>

<PageHeader
	title="Integrations"
	description="Everything your shop can plug into. Each one works on its own — nothing here is required for the shop to run."
>
	{#snippet actions()}
		<span class="rounded-xl border border-border px-3 py-2 text-sm text-ink">
			<span class="num font-semibold">{data.connected}</span>
			<span class="text-ink-muted">of</span>
			<span class="num font-semibold">{data.total}</span>
			<span class="text-ink-muted">set up</span>
		</span>
	{/snippet}
</PageHeader>

<p class="mt-4 rounded-2xl bg-surface-alt p-4 text-sm text-ink-muted">
	These are set up once by whoever runs your server — they are secrets, so they live outside this
	admin. Send the highlighted names to your developer; you never need to paste a key here.
</p>

<!-- Browse by category, the way a marketplace does. -->
<div class="mt-6 flex flex-col gap-3">
	<div class="flex flex-wrap items-center gap-2">
		<button
			type="button"
			aria-pressed={category === ''}
			class="rounded-xl px-3 py-1.5 text-sm transition-colors duration-[180ms] ease-brand
			       {category === '' ? 'bg-track font-medium text-ink' : 'text-ink-muted hover:text-ink'}"
			onclick={() => (category = '')}
		>
			All
			<span class="num ml-1 text-ink-faint">{data.total}</span>
		</button>
		{#each data.categories as c (c.title)}
			<button
				type="button"
				aria-pressed={category === c.title}
				class="rounded-xl px-3 py-1.5 text-sm transition-colors duration-[180ms] ease-brand
				       {category === c.title ? 'bg-track font-medium text-ink' : 'text-ink-muted hover:text-ink'}"
				onclick={() => (category = c.title)}
			>
				{c.title}
				<span class="num ml-1 text-ink-faint">{c.total}</span>
			</button>
		{/each}
	</div>

	<div class="flex flex-wrap items-center gap-3">
		<div class="relative min-w-56 flex-1 sm:max-w-72">
			<Search
				size={16}
				class="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-faint"
			/>
			<input
				type="search"
				bind:value={q}
				placeholder="Search integrations"
				aria-label="Search integrations"
				class="h-11 w-full rounded-xl border border-border bg-surface pr-3.5 pl-10 text-sm text-ink
				       transition-colors duration-[180ms] ease-brand placeholder:text-ink-faint"
			/>
		</div>
		<button
			type="button"
			aria-pressed={onlyMissing}
			class="h-11 rounded-xl border px-3.5 text-sm transition-colors duration-[180ms] ease-brand
			       {onlyMissing
				? 'border-primary bg-primary-soft font-medium text-primary'
				: 'border-border text-ink-muted hover:text-ink'}"
			onclick={() => (onlyMissing = !onlyMissing)}
		>
			Not set up only
		</button>
		{#if category || onlyMissing || q}
			<button
				type="button"
				class="flex items-center gap-1 text-xs text-ink-muted underline transition-colors hover:text-ink"
				onclick={clear}
			>
				<X size={13} />
				Clear
			</button>
		{/if}
	</div>

	{#if category}
		<p class="text-sm text-ink-muted">
			{data.categories.find((c) => c.title === category)?.blurb}
		</p>
	{/if}
</div>

<!-- One card per integration, so a category with two entries does not look
     like a truncated list. -->
<div class="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
	{#each shown as item (item.key)}
		<article class="flex flex-col rounded-3xl border border-border bg-surface p-5">
			<div class="flex items-start gap-3">
				{#if CHANNEL_KEYS.has(item.key)}
					<ChannelBadge channel={item.key} size="md" />
				{:else}
					<span
						class="grid size-9 shrink-0 place-items-center rounded-lg bg-surface-alt text-ink-muted"
					>
						<Plug size={17} />
					</span>
				{/if}
				<div class="min-w-0 flex-1">
					<h2 class="text-sm font-medium text-ink">{item.name}</h2>
					<p class="text-xs text-ink-faint">{item.category}</p>
				</div>
				<!-- A word beside the tick: the state has to survive a greyscale print. -->
				{#if item.connected}
					<span
						class="inline-flex shrink-0 items-center gap-1 rounded-lg border border-border px-1.5 py-0.5 text-xs font-medium text-ink"
					>
						<Check size={11} style="color: var(--color-ok-fg)" />
						On
					</span>
				{:else}
					<span
						class="shrink-0 rounded-lg border border-border px-1.5 py-0.5 text-xs font-medium text-ink-muted"
					>
						Not set up
					</span>
				{/if}
			</div>

			<p class="mt-3 flex-1 text-sm text-ink-muted">{item.purpose}</p>

			{#if !item.connected && item.vars.length}
				<div class="mt-3 flex flex-wrap items-center gap-1.5">
					{#each item.vars as v (v)}
						<button
							type="button"
							onclick={() => copy(v, item.key + v)}
							class="inline-flex items-center gap-1 rounded-lg bg-surface-alt px-2 py-1 font-mono text-xs text-ink transition-colors hover:bg-track"
							title="Copy name"
						>
							{v}
							{#if copied === item.key + v}
								<Check size={11} style="color: var(--color-ok-fg)" />
							{:else}
								<Copy size={11} class="text-ink-faint" />
							{/if}
						</button>
					{/each}
				</div>
			{/if}

			{#if item.webhook}
				<p class="mt-3 text-xs text-ink-muted">
					Callback URL: <span class="font-mono text-ink">{item.webhook}</span>
				</p>
			{/if}
		</article>
	{:else}
		<p
			class="col-span-full rounded-3xl border border-border bg-surface px-4 py-16 text-center text-sm text-ink-faint"
		>
			Nothing matches that.
		</p>
	{/each}
</div>

<p class="mt-6 text-xs text-ink-muted">
	Everything here is also listed in the project's <span class="font-mono">.env.example</span> file.
</p>
