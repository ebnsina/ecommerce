<script lang="ts">
	/** Body copy for policy and information pages. The HTML arrives already
	    sanitised from the server — see resolveBlocks(). */
	let { props }: { props: Record<string, any> } = $props();
</script>

{#if props.body}
	<section class="mx-auto px-4 py-8 {props.width === 'full' ? 'max-w-7xl' : 'max-w-3xl'}">
		{#if props.heading}
			<h1 class="mb-5 text-2xl font-semibold tracking-tight text-ink">{props.heading}</h1>
		{/if}
		<div class="rich">{@html props.body}</div>
	</section>
{/if}
