<script lang="ts">
	import { ArrowLeft, EyeOff } from '@lucide/svelte';

	let { data } = $props();

	const when = (d: Date | string | null) =>
		d
			? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
			: '';
</script>

<svelte:head>
	<title>{data.post.seoTitle || data.post.title} · {data.settings.store.name}</title>
	{#if data.post.seoDescription || data.post.excerpt}
		<meta name="description" content={data.post.seoDescription || data.post.excerpt} />
	{/if}
</svelte:head>

<article class="mx-auto max-w-3xl px-4 py-8">
	<a href="/blog" class="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
		<ArrowLeft size={15} />
		Blog
	</a>

	{#if !data.post.published}
		<!-- Staff can read a draft to check it; nobody else can reach this page. -->
		<p
			class="mt-4 flex items-center gap-2 rounded-2xl border border-border bg-surface-alt px-4 py-3 text-sm text-ink"
		>
			<EyeOff size={15} class="text-warn-fg" />
			This is a draft. Only you can see it.
		</p>
	{/if}

	<h1 class="mt-4 text-3xl font-semibold tracking-tight text-ink">{data.post.title}</h1>
	{#if data.post.titleBn}
		<p class="mt-1 text-lg text-ink-muted">{data.post.titleBn}</p>
	{/if}
	<p class="mt-2 text-sm text-ink-faint">
		{when(data.post.publishedAt)}{data.post.author ? ` · ${data.post.author}` : ''}
	</p>

	{#if data.post.cover}
		<img
			src={data.post.cover}
			alt=""
			class="mt-6 aspect-[16/9] w-full rounded-3xl bg-surface-alt object-cover"
		/>
	{/if}

	<!-- Sanitised on save, never on render: the stored HTML is already safe. -->
	<div class="rich mt-6">{@html data.post.body}</div>

	{#if data.post.tags?.length}
		<ul class="mt-8 flex flex-wrap gap-2">
			{#each data.post.tags as tag (tag)}
				<li>
					<a
						href="/blog?tag={encodeURIComponent(tag)}"
						class="rounded-xl border border-border px-3 py-1 text-xs text-ink-muted transition-colors hover:text-ink"
					>
						{tag}
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</article>

{#if data.more.length}
	<section class="mx-auto max-w-3xl px-4 pb-12">
		<h2 class="text-sm font-semibold tracking-wide text-ink uppercase">Read next</h2>
		<div class="mt-4 grid gap-4 sm:grid-cols-3">
			{#each data.more as post (post.slug)}
				<a href="/blog/{post.slug}" class="group block">
					<span class="block aspect-[16/9] overflow-hidden rounded-2xl bg-surface-alt">
						{#if post.cover}
							<img src={post.cover} alt="" loading="lazy" class="size-full object-cover" />
						{/if}
					</span>
					<span
						class="mt-2 block text-sm text-ink transition-colors duration-[180ms] ease-brand group-hover:text-primary"
					>
						{post.title}
					</span>
				</a>
			{/each}
		</div>
	</section>
{/if}
