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

<style>
	.rich {
		color: var(--color-ink-muted);
		font-size: 0.9375rem;
		line-height: 1.7;
	}
	.rich :global(> * + *) {
		margin-top: 1em;
	}
	.rich :global(h2) {
		color: var(--color-ink);
		font-size: 1.125rem;
		font-weight: 600;
		letter-spacing: -0.01em;
		margin-top: 1.75em;
	}
	.rich :global(h3) {
		color: var(--color-ink);
		font-size: 1rem;
		font-weight: 600;
		margin-top: 1.5em;
	}
	.rich :global(ul) {
		list-style: disc;
		padding-left: 1.25rem;
	}
	.rich :global(ol) {
		list-style: decimal;
		padding-left: 1.25rem;
	}
	.rich :global(li + li) {
		margin-top: 0.35em;
	}
	.rich :global(a) {
		color: var(--color-primary);
		text-decoration: underline;
	}
	.rich :global(blockquote) {
		border-left: 2px solid var(--color-border);
		padding-left: 1rem;
	}
	.rich :global(strong) {
		color: var(--color-ink);
		font-weight: 600;
	}
</style>
