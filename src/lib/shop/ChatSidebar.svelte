<script lang="ts">
	import { page } from '$app/state';
	import { enhance } from '$app/forms';
	import { SHOP } from '$lib/paths';
	import { SquarePen, Trash2, X } from '@lucide/svelte';

	let {
		threads,
		open = $bindable(false)
	}: {
		threads: { id: string; title: string; updatedAt: Date }[];
		/** On a phone the list is a drawer; on a desktop it is always there. */
		open?: boolean;
	} = $props();

	const current = $derived(page.params.thread ?? null);

	/* Today, yesterday, then the date — the grouping every list of past
	   conversations settles on, because that is how people remember them. */
	/* Midnight of whatever day this is, as a number — no Date is kept around, so
	   there is nothing mutable to make reactive. */
	const day = (d: Date | number) => {
		// eslint-disable-next-line svelte/prefer-svelte-reactivity -- local to this call, thrown away as a number
		const at = new Date(d);
		at.setHours(0, 0, 0, 0);
		return at.getTime();
	};
	function when(date: Date) {
		const today = day(Date.now());
		const diff = Math.round((today - day(date)) / 864e5);
		if (diff <= 0) return 'Today';
		if (diff === 1) return 'Yesterday';
		if (diff < 7) return 'This week';
		return new Date(date).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
	}

	const groups = $derived(
		threads.reduce<{ head: string; items: typeof threads }[]>((acc, t) => {
			const head = when(t.updatedAt);
			const last = acc[acc.length - 1];
			if (last?.head === head) last.items.push(t);
			else acc.push({ head, items: [t] });
			return acc;
		}, [])
	);
</script>

<!-- Off-canvas below `lg`, a column beside the thread above it. -->
{#if open}
	<button
		class="fixed inset-0 z-30 bg-ink/40 lg:hidden"
		aria-label="Close the conversation list"
		onclick={() => (open = false)}
	></button>
{/if}

<aside
	class="fixed inset-y-0 left-0 z-40 flex w-72 shrink-0 flex-col border-r border-border bg-surface-alt
	       transition-transform duration-[280ms] ease-brand motion-reduce:transition-none
	       lg:static lg:z-auto lg:translate-x-0
	       {open ? 'translate-x-0' : '-translate-x-full'}"
	aria-label="Your conversations"
>
	<div class="flex items-center gap-2 p-3">
		<a
			href="{SHOP}/ask"
			class="flex h-10 flex-1 items-center gap-2 rounded-xl border border-border bg-surface px-3 text-sm font-medium text-ink
			       transition-colors duration-[180ms] ease-brand hover:border-primary motion-reduce:transition-none"
			onclick={() => (open = false)}
		>
			<SquarePen size={16} aria-hidden="true" />
			New chat
		</a>
		<button
			class="grid size-10 place-items-center rounded-xl text-ink-muted hover:text-ink lg:hidden"
			aria-label="Close the conversation list"
			onclick={() => (open = false)}
		>
			<X size={18} />
		</button>
	</div>

	<div class="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
		{#each groups as group (group.head)}
			<p class="px-3 pt-4 pb-1.5 text-xs font-medium text-ink-muted">{group.head}</p>
			<ul>
				{#each group.items as t (t.id)}
					{@const active = t.id === current}
					<li class="group relative">
						<a
							href="{SHOP}/ask/{t.id}"
							aria-current={active ? 'page' : undefined}
							onclick={() => (open = false)}
							class="block truncate rounded-xl py-2 pr-10 pl-3 text-sm transition-colors duration-[180ms] ease-brand motion-reduce:transition-none
							       {active ? 'bg-surface font-medium text-ink' : 'text-ink-muted hover:bg-surface'}"
						>
							{t.title}
						</a>
						<!-- A real form, so it works without JavaScript and posts to the
						     thread it deletes rather than the one being read. -->
						<form
							method="POST"
							action="{SHOP}/ask/{t.id}?/delete"
							use:enhance
							class="absolute top-1/2 right-1 -translate-y-1/2"
						>
							<button
								class="grid size-8 place-items-center rounded-lg text-ink-faint opacity-0 transition-opacity
								       group-focus-within:opacity-100 group-hover:opacity-100 hover:text-sale focus:opacity-100"
								aria-label="Delete “{t.title}”"
							>
								<Trash2 size={15} />
							</button>
						</form>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="px-3 pt-4 text-sm text-ink-muted">
				Nothing yet. Ask for something and it will be kept here.
			</p>
		{/each}
	</div>
</aside>
