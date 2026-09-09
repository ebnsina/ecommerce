<script lang="ts">
	import AskThread from '$lib/shop/AskThread.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>Tell us what you need</title>
</svelte:head>

<AskThread problem={data.error ?? ''} />
