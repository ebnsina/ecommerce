<script lang="ts">
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import { fly } from 'svelte/transition';
	import { Star, MessageCircleQuestion, Check } from '@lucide/svelte';
	import { flyUp } from '$lib/motion';
	import Rating from './Rating.svelte';
	import Button from '$lib/ui/Button.svelte';
	import Input from '$lib/ui/Input.svelte';
	import Textarea from '$lib/ui/Textarea.svelte';
	import Tabs from '$lib/ui/Tabs.svelte';

	type Review = {
		id: string;
		authorName: string;
		rating: number;
		title: string | null;
		body: string | null;
		createdAt: Date | string;
	};
	type Question = {
		id: string;
		authorName: string;
		question: string;
		answer: string | null;
		createdAt: Date | string;
	};

	let {
		product,
		specs,
		reviews,
		questions,
		customerName = '',
		form
	}: {
		product: { description: string | null; descriptionBn: string | null; rating: number };
		specs: { label: string; value: string }[];
		reviews: { rows: Review[]; breakdown: { stars: number; n: number }[]; total: number };
		questions: Question[];
		customerName?: string;
		form?: Record<string, unknown> | null;
	} = $props();

	const tabs = $derived([
		{ value: 'description', label: 'Description' },
		{ value: 'specs', label: 'Specifications' },
		{ value: 'reviews', label: 'Reviews', badge: reviews.total },
		{ value: 'qa', label: 'Q&A', badge: questions.length }
	]);

	/* A failed or accepted submission must land on the tab it came from. */
	let active = $state(
		untrack(() =>
			form?.reviewError || form?.reviewSubmitted
				? 'reviews'
				: form?.questionError || form?.questionSubmitted
					? 'qa'
					: 'description'
		)
	);

	let rating = $state(5);

	const when = (d: Date | string) =>
		new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

	const maxBucket = $derived(Math.max(1, ...reviews.breakdown.map((b) => b.n)));
</script>

<section class="mx-auto max-w-7xl px-4 py-8">
	<div class="overflow-hidden rounded-3xl border border-border bg-surface">
		<div class="p-4 pb-0 sm:px-6">
			<Tabs {tabs} bind:value={active} />
		</div>

		<div class="p-5 sm:p-6">
			{#if active === 'description'}
				<div in:fly={flyUp()}>
					{#if product.description}
						<p class="text-sm whitespace-pre-line text-ink-muted">{product.description}</p>
					{:else}
						<p class="text-sm text-ink-faint">No description yet.</p>
					{/if}
					{#if product.descriptionBn}
						<p class="mt-4 text-sm whitespace-pre-line text-ink-muted">{product.descriptionBn}</p>
					{/if}
				</div>
			{:else if active === 'specs'}
				<dl class="grid gap-x-8 sm:grid-cols-2" in:fly={flyUp()}>
					{#each specs as spec (spec.label)}
						<div class="flex justify-between gap-4 border-b border-border py-2.5 last:border-0">
							<dt class="text-sm text-ink-muted">{spec.label}</dt>
							<dd class="text-right text-sm font-medium text-ink">{spec.value}</dd>
						</div>
					{:else}
						<p class="text-sm text-ink-faint">No specifications listed.</p>
					{/each}
				</dl>
			{:else if active === 'reviews'}
				<div class="grid gap-8 lg:grid-cols-[16rem_1fr]" in:fly={flyUp()}>
					<!-- summary -->
					<div>
						<p class="num text-4xl font-semibold text-ink">{(product.rating / 10).toFixed(1)}</p>
						<Rating rating={product.rating} size={15} />
						<p class="mt-1 text-xs text-ink-muted">
							Based on <span class="num">{reviews.total}</span>
							{reviews.total === 1 ? 'review' : 'reviews'}
						</p>

						<ul class="mt-4 flex flex-col gap-1.5">
							{#each reviews.breakdown as b (b.stars)}
								<li class="flex items-center gap-2">
									<span class="num w-3 text-xs text-ink-muted">{b.stars}</span>
									<Star size={11} class="fill-star text-star" />
									<span class="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-alt">
										<span
											class="block h-full rounded-full bg-star"
											style="width:{(b.n / maxBucket) * 100}%"
										></span>
									</span>
									<span class="num w-5 text-right text-xs text-ink-muted">{b.n}</span>
								</li>
							{/each}
						</ul>
					</div>

					<!-- list + form -->
					<div>
						{#if reviews.rows.length}
							<ul class="flex flex-col gap-5">
								{#each reviews.rows as r (r.id)}
									<li class="border-b border-border pb-5 last:border-0 last:pb-0">
										<div class="flex flex-wrap items-center gap-3">
											<Rating rating={r.rating * 10} size={13} />
											<span class="text-sm font-medium text-ink">{r.authorName}</span>
											<span class="text-xs text-ink-faint">{when(r.createdAt)}</span>
										</div>
										{#if r.title}
											<p class="mt-1.5 text-sm font-medium text-ink">{r.title}</p>
										{/if}
										{#if r.body}
											<p class="mt-1 text-sm whitespace-pre-line text-ink-muted">{r.body}</p>
										{/if}
									</li>
								{/each}
							</ul>
						{:else}
							<p class="text-sm text-ink-faint">
								No reviews yet. Be the first to review this product.
							</p>
						{/if}

						<form
							method="POST"
							action="?/review"
							use:enhance
							class="mt-6 rounded-2xl bg-surface-alt p-4"
						>
							<h3 class="text-sm font-medium text-ink">Write a review</h3>

							{#if form?.reviewSubmitted}
								<p class="mt-3 flex items-center gap-1.5 text-sm text-success">
									<Check size={15} />
									Thanks — your review will appear once it is approved.
								</p>
							{:else}
								<div class="mt-3 flex flex-col gap-3">
									<div>
										<span class="mb-1.5 block text-sm font-medium text-ink">Your rating</span>
										<input type="hidden" name="rating" value={rating} />
										<div class="flex gap-1">
											{#each [1, 2, 3, 4, 5] as n (n)}
												<button
													type="button"
													aria-label="{n} star{n > 1 ? 's' : ''}"
													onclick={() => (rating = n)}
												>
													<Star
														size={22}
														class={n <= rating ? 'fill-star text-star' : 'fill-border text-border'}
													/>
												</button>
											{/each}
										</div>
									</div>

									<div class="grid gap-3 sm:grid-cols-2">
										<Input label="Your name" name="authorName" value={customerName} required />
										<Input label="Title (optional)" name="title" />
									</div>
									<Textarea label="Your review" name="body" rows={3} required />

									{#if form?.reviewError}
										<p class="text-sm text-sale" role="alert">{form.reviewError}</p>
									{/if}

									<Button size="sm" type="submit" class="self-start">Submit review</Button>
								</div>
							{/if}
						</form>
					</div>
				</div>
			{:else}
				<div in:fly={flyUp()}>
					{#if questions.length}
						<ul class="flex flex-col gap-5">
							{#each questions as q (q.id)}
								<li class="border-b border-border pb-5 last:border-0 last:pb-0">
									<div class="flex items-start gap-2.5">
										<MessageCircleQuestion size={17} class="mt-0.5 shrink-0 text-primary" />
										<div class="min-w-0">
											<p class="text-sm font-medium text-ink">{q.question}</p>
											<p class="text-xs text-ink-faint">
												{q.authorName} · {when(q.createdAt)}
											</p>
											{#if q.answer}
												<p class="mt-2 rounded-xl bg-surface-alt p-3 text-sm text-ink-muted">
													{q.answer}
												</p>
											{/if}
										</div>
									</div>
								</li>
							{/each}
						</ul>
					{:else}
						<p class="text-sm text-ink-faint">
							No questions answered yet. Ask one and we will reply.
						</p>
					{/if}

					<form
						method="POST"
						action="?/question"
						use:enhance
						class="mt-6 rounded-2xl bg-surface-alt p-4"
					>
						<h3 class="text-sm font-medium text-ink">Ask a question</h3>

						{#if form?.questionSubmitted}
							<p class="mt-3 flex items-center gap-1.5 text-sm text-success">
								<Check size={15} />
								Thanks — we will answer it here shortly.
							</p>
						{:else}
							<div class="mt-3 flex flex-col gap-3">
								<Input label="Your name" name="authorName" value={customerName} required />
								<Textarea
									label="Your question"
									name="question"
									rows={2}
									required
									placeholder="Is this available in other colours?"
								/>
								{#if form?.questionError}
									<p class="text-sm text-sale" role="alert">{form.questionError}</p>
								{/if}
								<Button size="sm" type="submit" class="self-start">Send question</Button>
							</div>
						{/if}
					</form>
				</div>
			{/if}
		</div>
	</div>
</section>
