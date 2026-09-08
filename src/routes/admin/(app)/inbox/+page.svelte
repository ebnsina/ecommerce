<script lang="ts">
	import { untrack } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { Search, Inbox, ShoppingBag } from '@lucide/svelte';
	import Input from '$lib/ui/Input.svelte';
	import Tabs from '$lib/ui/Tabs.svelte';
	import PageHeader from '$lib/admin/PageHeader.svelte';
	import ChannelBadge from '$lib/admin/ChannelBadge.svelte';

	let { data } = $props();

	let q = $state(untrack(() => data.filters.q));
	let status = $state(untrack(() => data.filters.status));

	function apply(patch: Record<string, string>) {
		const params = new URLSearchParams(page.url.searchParams);
		for (const [k, v] of Object.entries(patch)) v ? params.set(k, v) : params.delete(k);
		goto(`?${params}`, { keepFocus: true, noScroll: true });
	}

	let timer: ReturnType<typeof setTimeout>;
	const search = (v: string) => {
		clearTimeout(timer);
		timer = setTimeout(() => apply({ q: v }), 250);
	};

	const ago = (d: Date | string) => {
		const mins = Math.round((Date.now() - new Date(d).getTime()) / 60000);
		if (mins < 1) return 'now';
		if (mins < 60) return `${mins}m`;
		if (mins < 1440) return `${Math.round(mins / 60)}h`;
		return `${Math.round(mins / 1440)}d`;
	};
</script>

<svelte:head><title>Inbox · Admin</title></svelte:head>

<PageHeader
	title="Inbox"
	count={data.threads.length}
	description="Every channel in one thread list. Replies go back out the way they came in."
/>

<!-- Each channel wears its own mark, so the row reads at a glance rather than
     as six identical grey pills. Connected ones are full strength; the rest are
     dimmed and say why. -->
<div class="mt-4 flex flex-wrap gap-2">
	{#each data.channels as c (c.key)}
		<span
			class="flex items-center gap-2 rounded-xl border border-border bg-surface py-1.5 pr-3 pl-2
			       {c.configured ? '' : 'opacity-60'}"
		>
			<ChannelBadge channel={c.key} />
			<span class="text-sm font-medium text-ink">{c.label}</span>
			{#if c.configured}
				<span class="size-1.5 rounded-full bg-ok-fg" title="Connected"></span>
			{:else}
				<a href="/admin/integrations" class="text-xs text-ink-faint underline">not connected</a>
			{/if}
		</span>
	{/each}
</div>

<div class="mt-6 flex flex-wrap items-center gap-3">
	<Tabs
		tabs={[
			{ value: 'open', label: 'Open', badge: data.counts.open },
			{ value: 'snoozed', label: 'Snoozed', badge: data.counts.snoozed },
			{ value: 'closed', label: 'Closed', badge: data.counts.closed },
			{ value: 'all', label: 'All' }
		]}
		bind:value={status}
		onchange={(v) => apply({ status: v })}
	/>

	<div class="relative ml-auto min-w-56">
		<Input
			placeholder="Name or phone"
			bind:value={q}
			oninput={(e) => search(e.currentTarget.value)}
			class="[&_input]:pl-9"
			aria-label="Search conversations"
		/>
		<Search size={15} class="pointer-events-none absolute top-3.5 left-3 text-ink-faint" />
	</div>
</div>

<div class="mt-4 overflow-hidden rounded-3xl border border-border bg-surface">
	{#each data.threads as t (t.id)}
		<a
			href="/admin/inbox/{t.id}"
			class="flex items-start gap-3 border-b border-border px-4 py-3 transition-colors last:border-0 hover:bg-surface-alt"
		>
			<span class="mt-1 shrink-0">
				<ChannelBadge channel={t.channel} />
			</span>

			<span class="min-w-0 flex-1">
				<span class="flex items-center gap-2">
					<span
						class="truncate text-sm {t.unread ? 'font-semibold text-ink' : 'font-medium text-ink'}"
					>
						{t.name}
					</span>
					{#if t.phone}
						<span class="num shrink-0 text-xs text-ink-faint">{t.phone}</span>
					{/if}
					{#if t.unread}
						<span class="size-2 shrink-0 rounded-full bg-primary"></span>
					{/if}
				</span>
				<span class="mt-0.5 line-clamp-1 text-sm text-ink-muted"
					>{t.preview || 'No messages yet'}</span
				>
			</span>

			<span class="num shrink-0 text-xs text-ink-faint">{ago(t.lastMessageAt)}</span>
		</a>
	{:else}
		<div class="flex flex-col items-center gap-3 px-6 py-20">
			<Inbox size={24} class="text-ink-faint" />
			<p class="text-sm text-ink-muted">Nothing here.</p>
		</div>
	{/each}
</div>
