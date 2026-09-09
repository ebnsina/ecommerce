<script lang="ts">
	import { tick, untrack } from 'svelte';
	import { replaceState, invalidate } from '$app/navigation';
	import { ArrowUp, ArrowRight } from '@lucide/svelte';
	import ProductCard from '$lib/shop/ProductCard.svelte';
	import Orb from '$lib/shop/Orb.svelte';
	import Button from '$lib/ui/Button.svelte';
	import { SHOP, shop } from '$lib/paths';
	import type { CardProduct } from '$lib/shop/ProductCard.svelte';

	let {
		initial = [],
		threadId = null,
		problem: initialProblem = ''
	}: {
		/** Turns already saved, with their products read fresh from the catalogue. */
		initial?: Turn[];
		threadId?: string | null;
		problem?: string;
	} = $props();

	export type Turn = {
		role: 'user' | 'assistant';
		content: string;
		/** How much of `content` is on screen. Full for anything not just said. */
		shown?: number;
		rows?: CardProduct[];
		total?: number;
		query?: string;
		followUps?: string[];
	};

	/* Whatever was saved is already here, rendered by the server: a thread
	   reopened tomorrow, or answered without JavaScript, reads the same as one
	   that has been on screen all along. */
	let thread = $state<Turn[]>(untrack(() => initial));
	let saved = $state<string | null>(untrack(() => threadId));

	/**
	 * The answer is written out rather than dropped in.
	 *
	 * It is a reveal, not token streaming: the search has to finish before
	 * there is anything to say, so the whole line is already here. Writing it
	 * out is what makes the wait feel like an answer being given rather than a
	 * page that stalled and then jumped.
	 */
	function reveal(index: number) {
		const full = thread[index]?.content ?? '';
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			thread[index].shown = full.length;
			return;
		}

		const step = () => {
			const turn = thread[index];
			if (!turn || (turn.shown ?? 0) >= full.length) return;
			// Three characters a frame: about 180 a second, near reading speed.
			turn.shown = Math.min(full.length, (turn.shown ?? 0) + 3);
			requestAnimationFrame(step);
		};
		requestAnimationFrame(step);
	}

	let draft = $state('');
	let busy = $state(false);
	let problem = $state(untrack(() => initialProblem));
	/* Brings the question just asked to the top of the window. The answer is
	   written underneath it, and a view pinned to the bottom of a growing page
	   is a view that keeps moving under the reader. */
	function showLatestQuestion() {
		document
			.getElementById(`turn-${thread.length - 1}`)
			?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}

	/* Written against what the demo shop actually stocks — fashion, groceries,
	   home, gadgets. An example that returns nothing teaches the visitor the
	   box does not work, which is the opposite of what an example is for. */
	const examples = [
		'A saree for my sister under 2000 taka',
		'Kitchen things that are on offer',
		'A power bank with good reviews',
		'Winter clothes for a small child'
	];

	async function send(text: string) {
		const message = text.trim();
		if (!message || busy) return;

		problem = '';
		draft = '';
		thread = [...thread, { role: 'user', content: message }];
		busy = true;
		await tick();
		showLatestQuestion();

		try {
			const res = await fetch(shop('/ask/turn'), {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					message,
					threadId: saved,
					// Only the words: the product rows are ours, not context for a model.
					history: thread.slice(-6).map((t) => ({ role: t.role, content: t.content }))
				})
			});
			const body = await res.json();

			if (!res.ok || body.error) {
				problem = body.error ?? 'The assistant is not answering just now.';
			} else {
				/* The endpoint speaks of a `reply`; a turn holds `content`. Spreading
				   the body straight in left every answer with no text at all. */
				const { reply, threadId: id, ...rest } = body;
				thread = [...thread, { role: 'assistant', content: reply, ...rest, shown: 0 }];
				reveal(thread.length - 1);

				/* The conversation now has an address. Replacing rather than pushing
				   keeps the back button pointing where the reader came from, and the
				   sidebar is refreshed so the new thread appears in it. */
				if (id && id !== saved) {
					saved = id;
					replaceState(`${SHOP}/ask/${id}`, {});
				}
				invalidate('chat:threads');
			}
		} catch {
			problem = 'That did not get through. Try again.';
		} finally {
			busy = false;
		}
	}
</script>

<!-- Two rows: a thread that scrolls and a composer that does not. The window
     itself never scrolls, so the box you type in is always where you left it. -->
<div class="flex min-h-0 flex-1 flex-col">
	{#if thread.length === 0}
		<!-- Empty state: the orb, one line, and four things to press. -->
		<div class="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
			<Orb size={44} />
			<h1 class="mt-5 text-2xl font-semibold tracking-tight text-ink">What are you after?</h1>
			<p class="mt-2 max-w-md text-sm text-ink-muted">
				Describe it the way you would to a shopkeeper — a budget, an occasion, who it is for.
			</p>

			<ul class="mt-7 flex flex-wrap justify-center gap-2">
				{#each examples as example (example)}
					<li>
						<button
							type="button"
							onclick={() => send(example)}
							class="rounded-xl border border-border bg-surface px-3 py-2 text-xs text-ink-muted
							       transition-colors duration-[180ms] ease-brand hover:border-brand-300 hover:text-ink"
						>
							{example}
						</button>
					</li>
				{/each}
			</ul>
		</div>
	{:else}
		<!-- The one thing on the page that scrolls. The tail of empty space below
		     is deliberate: without it the last question cannot reach the top of
		     the view, and the thread appears to ignore being scrolled to. -->
		<!-- The gutter is reserved whether or not a scrollbar is showing, so the
		     thread and the box below it do not shift sideways the moment an answer
		     grows past the fold. -->
		<div class="min-h-0 flex-1 [scrollbar-gutter:stable] overflow-y-auto overscroll-contain">
			<div class="mx-auto max-w-3xl space-y-8 px-4 pt-6 pb-[55vh]">
				{#each thread as turn, i (i)}
					{@const newest = i === thread.length - 1}
					{#if turn.role === 'user'}
						<div id="turn-{i}" class="flex scroll-mt-24 justify-end">
							<p
								class="max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-white"
							>
								{turn.content}
							</p>
						</div>
					{:else}
						<div class="flex gap-3">
							{#if newest}
								<Orb size={22} class="mt-0.5" />
							{:else}
								<!-- Older turns get a plain mark: an orb is a WebGL context, and a
							     browser gives a page about a dozen of them. -->
								<span class="mt-1 size-4 shrink-0 rounded-full bg-primary/25" aria-hidden="true"
								></span>
							{/if}
							<div class="min-w-0 flex-1">
								<p class="text-sm text-ink">
									{turn.shown === undefined
										? turn.content
										: (turn.content ?? '').slice(0, turn.shown)}
								</p>

								{#if turn.rows?.length}
									<div class="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
										{#each turn.rows.slice(0, 6) as product (product.id)}
											<ProductCard {product} />
										{/each}
									</div>

									{#if (turn.total ?? 0) > Math.min(turn.rows.length, 6)}
										<a
											href="{SHOP}/search?q={encodeURIComponent(turn.query ?? '')}"
											class="mt-3 inline-flex items-center gap-1 text-xs text-primary hover:underline"
										>
											See all {turn.total}
											<ArrowRight size={13} />
										</a>
									{/if}
								{:else if turn.rows}
									<p class="mt-3 text-sm text-ink-muted">
										Nothing in the shop matches that yet — the owner sees every search that found
										nothing.
									</p>
								{/if}

								{#if turn.followUps?.length}
									<ul class="mt-4 flex flex-wrap gap-2">
										{#each turn.followUps as followUp (followUp)}
											<li>
												<button
													type="button"
													onclick={() => send(followUp)}
													class="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-ink-muted
												       transition-colors duration-[180ms] ease-brand hover:border-brand-300 hover:text-ink"
												>
													{followUp}
												</button>
											</li>
										{/each}
									</ul>
								{/if}
							</div>
						</div>
					{/if}
				{/each}

				{#if busy}
					<div class="flex items-center gap-3">
						<Orb size={22} />
						<span class="text-sm text-ink-muted">Looking…</span>
					</div>
				{/if}
			</div>
		</div>
	{/if}

	{#if problem}
		<p class="mx-auto w-full max-w-3xl px-4 pb-3 text-sm text-ink" role="alert">
			{problem}
		</p>
	{/if}

	<!-- A GET form, so with JavaScript off this still asks and the answer comes
	     back rendered by the server. With it, the submit is intercepted and the
	     thread carries on in place. -->
	<form
		method="GET"
		action={shop('/ask')}
		class="mx-auto w-full max-w-3xl shrink-0 px-4 pt-2 pb-5"
		onsubmit={(e) => {
			e.preventDefault();
			send(draft);
		}}
	>
		<div
			class="flex h-14 items-center gap-2 rounded-2xl border border-border bg-surface p-2
			       focus-within:outline focus-within:outline-2 focus-within:outline-offset-2
			       focus-within:outline-primary"
		>
			<label class="sr-only" for="ask">What are you looking for?</label>
			<input
				id="ask"
				name="q"
				bind:value={draft}
				placeholder="Ask for anything in the shop"
				autocomplete="off"
				class="h-10 min-w-0 flex-1 bg-transparent px-2 text-sm text-ink placeholder:text-ink-faint focus:outline-none"
			/>
			<Button type="submit" disabled={busy || !draft.trim()} aria-label="Send">
				<ArrowUp size={16} />
			</Button>
		</div>
		<p class="mt-2 text-center text-xs text-ink-faint">
			Prices and stock come from the shop, never from the assistant.
		</p>
	</form>
</div>
