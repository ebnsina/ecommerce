<script lang="ts">
	import type { BlockProps } from './schema';
	/** Body copy for policy and information pages. The HTML arrives already
	    sanitised from the server — see resolveBlocks(). */
	let { props }: { props: BlockProps } = $props();
</script>

{#if props.body}
	<section class="mx-auto px-4 py-8 {props.width === 'full' ? 'max-w-7xl' : 'max-w-3xl'}">
		{#if props.heading}
			<h1 class="mb-5 text-2xl font-semibold tracking-tight text-ink">{props.heading}</h1>
		{/if}
		<!-- eslint-disable-next-line svelte/no-at-html-tags -- sanitised in server/blocks.ts when the page is saved, never on render -->
		<div class="rich">{@html props.body}</div>
	</section>
{/if}
