<script lang="ts">
	import AskThread from '$lib/shop/AskThread.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>{data.thread.title}</title>
</svelte:head>

<!-- Keyed on the thread: moving between two saved conversations has to rebuild
     the component, or the second one opens showing the first one's turns. -->
{#key data.thread.id}
	<AskThread initial={data.thread.turns} threadId={data.thread.id} problem={data.problem} />
{/key}
