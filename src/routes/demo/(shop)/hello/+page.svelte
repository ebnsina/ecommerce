<script lang="ts">
	import LeadForm from '$lib/shop/LeadForm.svelte';
	let { form } = $props();
</script>

<svelte:head>
	<title>Before you look around · Dukkan</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<!-- The same form the dialog shows, as a page. Anyone without JavaScript, and
     anyone who follows the link directly, lands here. -->
<div class="mx-auto max-w-xl px-4 py-16">
	<h1 class="text-2xl font-semibold tracking-tight text-ink">Who are we talking to?</h1>
	<p class="mt-3 text-sm text-ink-muted">
		The demo is a real shop with real orders in it, and you are welcome to it. Leave a number and we
		will call you about setting one up for yourself.
	</p>

	<div class="mt-8">
		<LeadForm error={form?.error} field={form?.field} />
	</div>
</div>
