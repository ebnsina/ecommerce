<script lang="ts">
	import BlockRenderer from '$lib/blocks/BlockRenderer.svelte';
	import Button from '$lib/ui/Button.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>{data.seo.title || data.settings.store.name}</title>
	{#if data.seo.description}<meta name="description" content={data.seo.description} />{/if}
</svelte:head>

{#if data.preview}
	<p class="bg-star/15 px-4 py-2 text-center text-xs text-ink">
		Draft preview — shoppers still see the published version.
	</p>
{/if}

{#if data.blocks.length}
	<BlockRenderer blocks={data.blocks} categories={data.nav} />
{:else}
	<div class="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
		<h1 class="text-2xl font-semibold tracking-tight text-ink">{data.settings.store.name}</h1>
		<p class="text-sm text-ink-muted">
			This homepage has no blocks yet. Build it in the admin under Storefront → Pages.
		</p>
		<Button href="/demo/search">Browse products</Button>
	</div>
{/if}
