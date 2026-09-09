<script lang="ts">
	import { page } from '$app/state';
	import { ChevronRight } from '@lucide/svelte';
	import Img from './Img.svelte';

	type Cat = {
		id: string;
		name: string;
		slug: string;
		image: string | null;
		children: { id: string; name: string; slug: string }[];
	};

	let { nav, style = 'plain' }: { nav: Cat[]; style?: 'icons' | 'plain' } = $props();

	const here = $derived(page.url.pathname);
	/* Which row's children are showing. A grocer's rail opens the aisle in
	   place rather than sending you to a page to see what is in it. */
	let open = $state<string | null>(null);
</script>

<!-- Hidden below large, where the header's own menu already carries these —
     a rail on a phone is just a list in the way of the products. -->
<nav class="hidden w-56 shrink-0 py-4 lg:block" aria-label="Categories">
	<div
		class="sticky top-24 {style === 'icons'
			? 'overflow-hidden rounded-2xl border border-border bg-surface'
			: ''}"
	>
		<p
			class="px-3 pb-2 text-xs font-semibold tracking-wide text-ink-muted uppercase {style ===
			'icons'
				? 'border-b border-border pt-3'
				: ''}"
		>
			Categories
		</p>

		<ul class="flex flex-col {style === 'icons' ? 'py-1' : ''}">
			{#each nav as cat (cat.id)}
				{@const url = `/demo/c/${cat.slug}`}
				{@const current = here === url}
				<li>
					{#if style === 'icons'}
						<!-- Picture, name, and a chevron that opens the aisle in place.
						     The active row is marked by a bar at its left as well as a
						     tint, so the state does not rest on colour alone. -->
						<div
							class="flex items-center border-l-2 transition-colors duration-[180ms] ease-brand motion-reduce:transition-none
							       {current ? 'border-primary bg-primary-soft' : 'border-transparent hover:bg-surface-alt'}"
						>
							<a
								href={url}
								aria-current={current ? 'page' : undefined}
								class="flex min-w-0 flex-1 items-center gap-2.5 py-2 pl-2.5 text-[0.8125rem] leading-tight
								       {current ? 'font-medium text-primary' : 'text-ink'}"
							>
								<span
									class="grid size-8 shrink-0 place-items-center overflow-hidden rounded-lg bg-surface-alt"
								>
									{#if cat.image}
										<Img src={cat.image} width={64} height={64} class="size-full object-cover" />
									{/if}
								</span>
								<span class="truncate">{cat.name}</span>
							</a>

							{#if cat.children.length}
								<button
									class="grid size-8 shrink-0 place-items-center text-ink-faint hover:text-ink"
									aria-expanded={open === cat.id}
									aria-label="{open === cat.id ? 'Hide' : 'Show'} what is in {cat.name}"
									onclick={() => (open = open === cat.id ? null : cat.id)}
								>
									<ChevronRight
										size={15}
										class="transition-transform duration-[180ms] ease-brand motion-reduce:transition-none {open ===
										cat.id
											? 'rotate-90'
											: ''}"
									/>
								</button>
							{/if}
						</div>

						{#if open === cat.id}
							<ul class="bg-surface-alt py-1">
								{#each cat.children as sub (sub.id)}
									<li>
										<a
											href="/demo/c/{sub.slug}"
											class="block truncate py-1.5 pr-3 pl-[3.25rem] text-[0.8125rem] text-ink-muted hover:text-ink"
										>
											{sub.name}
										</a>
									</li>
								{/each}
							</ul>
						{/if}
					{:else}
						<a
							href={url}
							aria-current={current ? 'page' : undefined}
							class="block rounded-lg px-3 py-2 text-sm transition-colors duration-[180ms] ease-brand motion-reduce:transition-none
							       {current
								? 'bg-primary-soft font-medium text-primary'
								: 'text-ink-muted hover:bg-surface-alt hover:text-ink'}"
						>
							{cat.name}
						</a>
					{/if}
				</li>
			{/each}
		</ul>
	</div>
</nav>
