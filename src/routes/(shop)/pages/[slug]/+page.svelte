<script lang="ts">
	import BlockRenderer from '$lib/blocks/BlockRenderer.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>{data.page.seoTitle || data.page.title} · {data.settings.store.name}</title>
	{#if data.page.seoDescription}
		<meta name="description" content={data.page.seoDescription} />
	{/if}
</svelte:head>

{#if data.preview}
	<p class="bg-star/15 px-4 py-2 text-center text-xs text-ink">
		Draft preview — shoppers still see the published version.
	</p>
{:else if !data.page.published}
	<p class="bg-star/15 px-4 py-2 text-center text-xs text-ink">
		This page is hidden. Only staff can see it.
	</p>
{/if}

{#if data.blocks.length}
	<BlockRenderer blocks={data.blocks} categories={data.nav} />
{:else}
	<div class="mx-auto max-w-2xl px-4 py-20 text-center">
		<h1 class="text-2xl font-semibold tracking-tight text-ink">{data.page.title}</h1>
		<p class="mt-2 text-sm text-ink-muted">This page has no sections yet.</p>
	</div>
{/if}
