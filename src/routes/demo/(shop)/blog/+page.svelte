<script lang="ts">
	import { Newspaper } from '@lucide/svelte';
	import Button from '$lib/ui/Button.svelte';

	let { data } = $props();

	const when = (d: Date | string | null) =>
		d
			? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
			: '';
</script>

<svelte:head>
	<title>Blog · {data.settings.store.name}</title>
	<meta
		name="description"
		content="Buying guides, tips and news from {data.settings.store.name}."
	/>
</svelte:head>

<div class="mx-auto max-w-7xl px-4 py-8">
	<h1 class="text-2xl font-semibold tracking-tight text-ink">Blog</h1>

	{#if data.tags.length}
		<nav aria-label="Tags" class="mt-4 flex flex-wrap gap-2">
			<a
				href="/demo/blog"
				class="rounded-xl px-3 py-1.5 text-sm transition-colors duration-[180ms] ease-brand
				       {data.tag ? 'text-ink-muted hover:text-ink' : 'bg-track font-medium text-ink'}"
			>
				All
			</a>
			{#each data.tags as tag (tag)}
				<a
					href="/demo/blog?tag={encodeURIComponent(tag)}"
					class="rounded-xl px-3 py-1.5 text-sm transition-colors duration-[180ms] ease-brand
					       {data.tag === tag ? 'bg-track font-medium text-ink' : 'text-ink-muted hover:text-ink'}"
				>
					{tag}
				</a>
			{/each}
		</nav>
	{/if}

	{#if data.rows.length}
		<div class="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
			{#each data.rows as post (post.slug)}
				<article class="group">
					<a href="/demo/blog/{post.slug}" class="block">
						<span class="block aspect-[16/9] overflow-hidden rounded-2xl bg-surface-alt">
							{#if post.cover}
								<img
									src={post.cover}
									alt=""
									loading="lazy"
									class="size-full object-cover transition-transform duration-[280ms] ease-brand group-hover:scale-[1.02]"
								/>
							{/if}
						</span>
						<h2
							class="mt-3 text-base font-medium text-ink transition-colors duration-[180ms] ease-brand group-hover:text-primary"
						>
							{post.title}
						</h2>
					</a>
					{#if post.excerpt}
						<p class="mt-1 line-clamp-2 text-sm text-ink-muted">{post.excerpt}</p>
					{/if}
					<p class="mt-2 text-xs text-ink-faint">
						{when(post.publishedAt)}{post.author ? ` · ${post.author}` : ''}
					</p>
				</article>
			{/each}
		</div>

		{#if data.pages > 1}
			<div class="mt-10 flex items-center justify-center gap-3">
				<Button
					variant="secondary"
					size="sm"
					disabled={data.page <= 1}
					href="?page={data.page - 1}{data.tag ? `&tag=${encodeURIComponent(data.tag)}` : ''}"
				>
					Previous
				</Button>
				<span class="text-sm text-ink-muted">
					Page <span class="num">{data.page}</span> of <span class="num">{data.pages}</span>
				</span>
				<Button
					variant="secondary"
					size="sm"
					disabled={data.page >= data.pages}
					href="?page={data.page + 1}{data.tag ? `&tag=${encodeURIComponent(data.tag)}` : ''}"
				>
					Next
				</Button>
			</div>
		{/if}
	{:else}
		<div class="flex flex-col items-center gap-3 py-24 text-center">
			<Newspaper size={26} class="text-ink-faint" />
			<p class="text-sm text-ink-muted">Nothing published here yet.</p>
		</div>
	{/if}
</div>
