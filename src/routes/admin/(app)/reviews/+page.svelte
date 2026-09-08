<script lang="ts">
	import { enhance } from '$app/forms';
	import { Check, Trash2, EyeOff, Star, MessageCircleQuestion, Send } from '@lucide/svelte';
	import Button from '$lib/ui/Button.svelte';
	import Textarea from '$lib/ui/Textarea.svelte';
	import Tabs from '$lib/ui/Tabs.svelte';

	let { data, form } = $props();

	let tab = $state<'reviews' | 'questions'>('reviews');

	const when = (d: Date | string) =>
		new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
</script>

<svelte:head><title>Reviews &amp; Q&amp;A · Admin</title></svelte:head>

<h1 class="text-2xl font-semibold tracking-tight text-ink">Reviews &amp; Q&amp;A</h1>
<p class="mt-1 text-sm text-ink-muted">
	Reviews stay hidden until you approve them. Questions stay private until you answer.
</p>

{#if form?.error}
	<p
		class="mt-4 rounded-2xl border border-sale/30 bg-sale/8 px-4 py-3 text-sm text-sale"
		role="alert"
	>
		{form.error}
	</p>
{/if}

<div class="mt-6">
	<Tabs
		tabs={[
			{ value: 'reviews', label: 'Reviews', badge: data.pendingReviews },
			{ value: 'questions', label: 'Questions', badge: data.unanswered }
		]}
		bind:value={tab}
	/>
</div>

<div class="mt-4 overflow-hidden rounded-3xl border border-border bg-surface">
	{#if tab === 'reviews'}
		{#each data.reviews as r (r.id)}
			<article class="flex flex-wrap gap-4 border-b border-border p-5 last:border-0">
				<div class="min-w-0 flex-1">
					<div class="flex flex-wrap items-center gap-2">
						<span class="flex" aria-label="{r.rating} out of 5">
							{#each [1, 2, 3, 4, 5] as n (n)}
								<Star
									size={13}
									class={n <= r.rating ? 'fill-star text-star' : 'fill-border text-border'}
								/>
							{/each}
						</span>
						<span class="text-sm font-medium text-ink">{r.authorName}</span>
						<span class="text-xs text-ink-faint">{when(r.createdAt)}</span>
						{#if !r.approved}
							<span class="rounded-lg bg-star/15 px-2 py-0.5 text-xs text-ink">Pending</span>
						{/if}
					</div>

					<a
						href="/p/{r.productSlug}"
						target="_blank"
						rel="noopener"
						class="mt-1 block text-xs text-primary"
					>
						{r.productTitle}
					</a>

					{#if r.title}<p class="mt-2 text-sm font-medium text-ink">{r.title}</p>{/if}
					{#if r.body}<p class="mt-1 text-sm whitespace-pre-line text-ink-muted">{r.body}</p>{/if}
				</div>

				<div class="flex shrink-0 items-start gap-2">
					{#if r.approved}
						<form method="POST" action="?/unapprove" use:enhance>
							<input type="hidden" name="id" value={r.id} />
							<Button size="sm" variant="secondary" type="submit">
								<EyeOff size={14} />
								Hide
							</Button>
						</form>
					{:else}
						<form method="POST" action="?/approve" use:enhance>
							<input type="hidden" name="id" value={r.id} />
							<Button size="sm" type="submit">
								<Check size={14} />
								Approve
							</Button>
						</form>
					{/if}
					<form method="POST" action="?/deleteReview" use:enhance>
						<input type="hidden" name="id" value={r.id} />
						<button
							class="grid size-9 place-items-center rounded-xl text-ink-faint transition-colors hover:bg-sale/8 hover:text-sale"
							aria-label="Delete review"
						>
							<Trash2 size={15} />
						</button>
					</form>
				</div>
			</article>
		{:else}
			<p class="px-5 py-16 text-center text-sm text-ink-faint">No reviews yet.</p>
		{/each}
	{:else}
		{#each data.questions as q (q.id)}
			<article class="border-b border-border p-5 last:border-0">
				<div class="flex items-start gap-3">
					<MessageCircleQuestion size={17} class="mt-0.5 shrink-0 text-primary" />
					<div class="min-w-0 flex-1">
						<p class="text-sm font-medium text-ink">{q.question}</p>
						<p class="text-xs text-ink-faint">
							{q.authorName} · {when(q.createdAt)} ·
							<a href="/p/{q.productSlug}" target="_blank" rel="noopener" class="text-primary">
								{q.productTitle}
							</a>
						</p>

						{#if q.answer}
							<p class="mt-2 rounded-xl bg-surface-alt p-3 text-sm text-ink-muted">{q.answer}</p>
						{/if}

						<form method="POST" action="?/answer" use:enhance class="mt-3 flex flex-col gap-2">
							<input type="hidden" name="id" value={q.id} />
							<Textarea
								name="answer"
								rows={2}
								value={q.answer ?? ''}
								placeholder="Your answer appears on the product page."
							/>
							<Button size="sm" type="submit" class="self-start">
								<Send size={14} />
								{q.answer ? 'Update answer' : 'Publish answer'}
							</Button>
						</form>
					</div>

					<form method="POST" action="?/deleteQuestion" use:enhance>
						<input type="hidden" name="id" value={q.id} />
						<button
							class="grid size-9 place-items-center rounded-xl text-ink-faint transition-colors hover:bg-sale/8 hover:text-sale"
							aria-label="Delete question"
						>
							<Trash2 size={15} />
						</button>
					</form>
				</div>
			</article>
		{:else}
			<p class="px-5 py-16 text-center text-sm text-ink-faint">No questions yet.</p>
		{/each}
	{/if}
</div>
