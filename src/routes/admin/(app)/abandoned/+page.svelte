<script lang="ts">
	import { enhance } from '$app/forms';
	import { ShoppingBasket, Send, Check, TriangleAlert } from '@lucide/svelte';
	import { formatTk } from '$lib/money';
	import { formatPhone } from '$lib/phone';

	let { data, form } = $props();

	const ago = (d: Date | string) => {
		const hours = Math.round((Date.now() - new Date(d).getTime()) / 3600_000);
		if (hours < 24) return `${hours}h ago`;
		return `${Math.round(hours / 24)}d ago`;
	};
</script>

<svelte:head><title>Abandoned carts · Admin</title></svelte:head>

<div class="flex flex-wrap items-start justify-between gap-4">
	<div>
		<h1 class="text-2xl font-semibold tracking-tight text-ink">Abandoned carts</h1>
		<p class="mt-1 text-sm text-ink-muted">
			Shoppers who gave their number at checkout but never finished. Quiet for over
			{data.recovery.delayHours} hours.
		</p>
	</div>
	{#if data.list.length}
		<p class="text-right">
			<span class="num block text-xl font-semibold text-ink">{formatTk(data.value)}</span>
			<span class="block text-xs text-ink-muted">waiting in {data.list.length} carts</span>
		</p>
	{/if}
</div>

{#if !data.recovery.enabled}
	<p
		class="mt-4 flex items-center gap-2 rounded-2xl border border-border bg-surface-alt px-4 py-3 text-sm text-ink"
	>
		<TriangleAlert size={16} class="shrink-0 text-warn-fg" />
		Automatic reminders are off. Switch them on under
		<a href="/admin/settings" class="underline">Settings → Cart reminders</a>, or send one by hand
		below.
	</p>
{/if}

{#if form?.error}
	<p
		class="mt-4 rounded-2xl border border-sale/30 bg-sale/8 px-4 py-3 text-sm text-sale"
		role="alert"
	>
		{form.error}
	</p>
{:else if form?.sent}
	<p
		class="mt-4 flex items-center gap-2 rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-ink"
	>
		<Check size={16} class="shrink-0 text-ok-fg" />
		Reminder sent to {formatPhone(form.sent)}.
	</p>
{/if}

<div class="mt-6 overflow-hidden rounded-3xl border border-border bg-surface">
	{#each data.list as c (c.id)}
		<div class="flex flex-wrap items-center gap-4 border-b border-border px-4 py-3 last:border-0">
			<span class="grid size-9 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
				<ShoppingBasket size={16} />
			</span>
			<span class="min-w-40">
				<span class="block text-sm font-medium text-ink">{c.name || 'No name given'}</span>
				<span class="num block text-xs text-ink-muted">{formatPhone(c.phone)}</span>
			</span>
			<span class="num min-w-24 text-sm font-semibold text-ink">{formatTk(Number(c.value))}</span>
			<span class="min-w-20 text-xs text-ink-muted">{c.items} items</span>
			<span class="min-w-24 text-xs text-ink-muted">{ago(c.updatedAt)}</span>
			<span class="min-w-32 text-xs text-ink-muted">
				{c.remindedAt ? `reminded ${ago(c.remindedAt)}` : 'not reminded'}
			</span>

			<form method="POST" action="?/remind" use:enhance class="ml-auto">
				<input type="hidden" name="id" value={c.id} />
				<button
					class="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-medium text-ink transition-colors hover:bg-surface-alt"
				>
					<Send size={14} />
					{c.remindedAt ? 'Remind again' : 'Send reminder'}
				</button>
			</form>
		</div>
	{:else}
		<p class="px-4 py-16 text-center text-sm text-ink-faint">
			No carts left hanging. Everyone who started checkout finished it.
		</p>
	{/each}
</div>
