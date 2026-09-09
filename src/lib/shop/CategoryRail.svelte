<script lang="ts">
	import { page } from '$app/state';

	type Cat = {
		id: string;
		name: string;
		slug: string;
		children: { id: string; name: string; slug: string }[];
	};

	let { nav }: { nav: Cat[] } = $props();

	const here = $derived(page.url.pathname);
</script>

<!-- Hidden below large, where the header's own menu already carries these —
     a rail on a phone is just a list in the way of the products. -->
<nav class="hidden w-56 shrink-0 py-6 lg:block" aria-label="Categories">
	<div class="sticky top-24">
		<p class="px-3 pb-2 text-xs font-semibold tracking-wide text-ink-muted uppercase">Categories</p>
		<ul class="flex flex-col">
			{#each nav as cat (cat.id)}
				{@const url = `/demo/c/${cat.slug}`}
				{@const current = here === url}
				<li>
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
				</li>
			{/each}
		</ul>
	</div>
</nav>
