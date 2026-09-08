<script lang="ts">
	import { enhance } from '$app/forms';
	import { tick } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import {
		ArrowLeft,
		Send,
		Brain,
		Check,
		Archive,
		Clock,
		TriangleAlert,
		Package,
		ShoppingBag
	} from '@lucide/svelte';
	import { formatTk } from '$lib/money';
	import { formatPhone } from '$lib/phone';
	import { fadeIn, flyUp } from '$lib/motion';
	import Button from '$lib/ui/Button.svelte';
	import Textarea from '$lib/ui/Textarea.svelte';
	import OrderStatus from '$lib/shop/OrderStatus.svelte';
	import ChannelBadge from '$lib/admin/ChannelBadge.svelte';

	let { data, form } = $props();

	let body = $state('');
	let sending = $state(false);

	/* Suggest mode: the assistant drafts, a human sends. The draft lands in the
	   same box as anything typed, so nothing reaches a customer unread. */
	let suggesting = $state(false);
	let suggestion = $state('');
	let suggestError = $state('');
	let usedSuggestion = $state(false);

	const when = (d: Date | string) =>
		new Date(d).toLocaleString('en-GB', {
			day: 'numeric',
			month: 'short',
			hour: '2-digit',
			minute: '2-digit'
		});

	async function suggest() {
		suggesting = true;
		suggestError = '';
		suggestion = '';

		// The whole thread becomes the conversation, so the draft has context.
		const history = data.messages.map((m) => ({
			role: m.inbound ? 'user' : 'assistant',
			content: m.body
		}));

		try {
			const res = await fetch('/api/chat', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ messages: history })
			});

			if (!res.ok || !res.body) {
				const detail = await res.json().catch(() => null);
				suggestError = detail?.error ?? `The assistant is unavailable (${res.status}).`;
				return;
			}

			// Server-sent events: accumulate text deltas as they arrive.
			const reader = res.body.getReader();
			const decoder = new TextDecoder();
			let buffer = '';

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;
				buffer += decoder.decode(value, { stream: true });

				for (const line of buffer.split('\n')) {
					if (!line.startsWith('data:')) continue;
					const payload = line.slice(5).trim();
					if (!payload || payload === '[DONE]') continue;
					try {
						const evt = JSON.parse(payload);
						const delta = evt?.delta ?? evt?.content ?? evt?.text ?? '';
						if (typeof delta === 'string') suggestion += delta;
					} catch {
						// Partial frame — the next chunk completes it.
					}
				}
				buffer = buffer.slice(buffer.lastIndexOf('\n') + 1);
				await tick();
			}
		} catch (e) {
			suggestError = (e as Error).message;
		} finally {
			suggesting = false;
		}
	}

	function useSuggestion() {
		body = suggestion;
		usedSuggestion = true;
		suggestion = '';
	}
</script>

<svelte:head><title>{data.conversation.name} · Inbox · Admin</title></svelte:head>

<a
	href="/admin/inbox"
	class="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
>
	<ArrowLeft size={15} />
	Inbox
</a>

<div class="mt-3 flex flex-wrap items-start justify-between gap-4">
	<div class="flex items-center gap-3">
		<ChannelBadge channel={data.conversation.channel} size="md" />
		<div>
			<h1 class="text-xl font-semibold tracking-tight text-ink">{data.conversation.name}</h1>
			<p class="text-sm text-ink-muted">
				{data.channelLabel}
				{#if data.conversation.phone}
					· <span class="num">{formatPhone(data.conversation.phone)}</span>
				{/if}
			</p>
		</div>
	</div>

	<div class="flex gap-2">
		{#each [{ status: 'snoozed', label: 'Snooze', Icon: Clock }, { status: 'closed', label: 'Close', Icon: Archive }] as a (a.status)}
			{#if data.conversation.status !== a.status}
				<form method="POST" action="?/setStatus" use:enhance>
					<input type="hidden" name="status" value={a.status} />
					<Button size="sm" variant="secondary" type="submit">
						<a.Icon size={15} />
						{a.label}
					</Button>
				</form>
			{/if}
		{/each}
		{#if data.conversation.status !== 'open'}
			<form method="POST" action="?/setStatus" use:enhance>
				<input type="hidden" name="status" value="open" />
				<Button size="sm" type="submit">Reopen</Button>
			</form>
		{/if}
	</div>
</div>

{#if !data.channelReady}
	<p
		class="mt-4 flex items-center gap-2 rounded-2xl border border-star/40 bg-star/10 px-4 py-3 text-sm text-ink"
	>
		<TriangleAlert size={16} class="shrink-0 text-star" />
		{data.channelLabel} is not connected, so replies cannot be delivered. Add its credentials in the environment.
	</p>
{/if}

<div class="mt-4 grid gap-4 lg:grid-cols-[1fr_18rem]">
	<div class="flex flex-col rounded-3xl border border-border bg-surface">
		<!-- messages -->
		<div class="flex flex-col gap-3 p-5">
			{#each data.messages as m (m.id)}
				<div class="flex {m.inbound ? 'justify-start' : 'justify-end'}" transition:fade={fadeIn()}>
					<div class="max-w-[80%]">
						<div
							class="rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-line
							       {m.inbound ? 'bg-surface-alt text-ink' : 'bg-primary text-white'}"
						>
							{m.body}
						</div>
						<p
							class="mt-1 flex items-center gap-1.5 text-xs text-ink-faint {m.inbound
								? ''
								: 'justify-end'}"
						>
							{m.authorName ?? (m.inbound ? 'Customer' : 'Staff')} · {when(m.createdAt)}
							{#if m.fromSuggestion}
								<span class="flex items-center gap-1 text-primary" title="Drafted by the assistant">
									<Brain size={11} />
									assisted
								</span>
							{/if}
						</p>
					</div>
				</div>
			{:else}
				<p class="py-10 text-center text-sm text-ink-faint">No messages yet.</p>
			{/each}
		</div>

		<!-- composer -->
		<div class="border-t border-border p-5">
			{#if suggestion}
				<div class="mb-3 rounded-2xl bg-primary-soft p-3" transition:fly={flyUp()}>
					<p class="flex items-center gap-1.5 text-xs font-medium text-primary">
						<Brain size={13} />
						Suggested reply
					</p>
					<p class="mt-1.5 text-sm whitespace-pre-line text-ink">{suggestion}</p>
					<div class="mt-2 flex gap-2">
						<Button size="sm" onclick={useSuggestion}>
							<Check size={14} />
							Use this
						</Button>
						<Button size="sm" variant="ghost" onclick={() => (suggestion = '')}>Discard</Button>
					</div>
				</div>
			{/if}

			{#if suggestError}
				<p class="mb-3 text-sm text-sale" role="alert">{suggestError}</p>
			{/if}

			{#if form?.error}
				<p
					class="mb-3 rounded-2xl border border-sale/30 bg-sale/8 px-4 py-3 text-sm text-sale"
					role="alert"
				>
					{form.error}
				</p>
			{/if}

			<form
				method="POST"
				action="?/reply"
				use:enhance={() => {
					sending = true;
					return async ({ update }) => {
						sending = false;
						body = '';
						usedSuggestion = false;
						await update({ reset: false });
					};
				}}
			>
				<input type="hidden" name="fromSuggestion" value={usedSuggestion ? 'on' : ''} />
				<Textarea name="body" bind:value={body} rows={3} placeholder="Write a reply…" />

				<div class="mt-3 flex flex-wrap items-center gap-2">
					<Button
						type="button"
						variant="secondary"
						size="sm"
						loading={suggesting}
						disabled={!data.aiReady || !data.messages.length}
						onclick={suggest}
					>
						<Brain size={15} />
						Suggest a reply
					</Button>

					{#if !data.aiReady}
						<a href="/admin/integrations" class="text-xs text-ink-muted underline">
							Needs an API key — see Integrations
						</a>
					{/if}

					<Button type="submit" class="ml-auto" loading={sending} disabled={!body.trim()}>
						<Send size={15} />
						Send
					</Button>
				</div>
			</form>
		</div>
	</div>

	<!-- context: who this is, and what they have bought -->
	<aside class="h-fit rounded-3xl border border-border bg-surface p-5">
		{#if data.product}
			<!-- The missing context: what the customer was looking at when they wrote. -->
			<h2 class="flex items-center gap-2 text-sm font-medium text-ink">
				<ShoppingBag size={15} class="text-primary" />
				Asking about
			</h2>
			<a
				href="/p/{data.product.slug}"
				target="_blank"
				rel="noopener"
				class="mt-2 mb-5 flex items-center gap-3 rounded-2xl border border-border p-2.5 transition-colors hover:border-brand-300"
			>
				<span class="size-11 shrink-0 overflow-hidden rounded-xl bg-surface-alt">
					{#if data.product.image}
						<img src={data.product.image} alt="" class="size-full object-cover" />
					{/if}
				</span>
				<span class="min-w-0">
					<span class="block truncate text-sm font-medium text-ink">{data.product.title}</span>
					<span class="num block text-xs text-ink-muted">
						{formatTk(data.product.price)}
						· {data.product.hasVariants || data.product.stock > 0
							? `${data.product.stock} in stock`
							: 'out of stock'}
					</span>
				</span>
			</a>
		{:else if data.conversation.sourceUrl}
			<h2 class="text-sm font-medium text-ink">Wrote from</h2>
			<a
				href={data.conversation.sourceUrl}
				target="_blank"
				rel="noopener"
				class="mt-1 mb-5 block truncate text-xs text-primary"
			>
				{data.conversation.sourceUrl}
			</a>
		{/if}

		<h2 class="text-sm font-medium text-ink">Customer</h2>
		<p class="mt-2 text-sm text-ink">{data.conversation.name}</p>
		{#if data.conversation.phone}
			<a href="tel:{data.conversation.phone}" class="num text-sm text-primary">
				{formatPhone(data.conversation.phone)}
			</a>
		{/if}
		{#if data.conversation.customerId}
			<a
				href="/admin/customers/{data.conversation.customerId}"
				class="mt-2 block text-xs text-primary"
			>
				Open customer record
			</a>
		{/if}

		<h3 class="mt-5 flex items-center gap-2 text-sm font-medium text-ink">
			<Package size={15} class="text-primary" />
			Recent orders
		</h3>
		{#each data.orders as o (o.id)}
			<a
				href="/admin/orders/{o.id}"
				class="mt-2 flex items-center justify-between gap-2 rounded-xl border border-border px-3 py-2 transition-colors hover:border-brand-300"
			>
				<span class="min-w-0">
					<span class="num block text-xs font-medium text-primary">{o.number}</span>
					<OrderStatus status={o.status} />
				</span>
				<span class="num shrink-0 text-sm font-medium text-ink">{formatTk(o.total)}</span>
			</a>
		{:else}
			<p class="mt-2 text-xs text-ink-faint">No orders from this number.</p>
		{/each}
	</aside>
</div>
