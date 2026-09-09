<script lang="ts">
	import { page } from '$app/state';
	import LeadForm from '$lib/shop/LeadForm.svelte';
	import { SHOP } from '$lib/paths';

	let { form } = $props();

	/* Where they were heading before the door. A link straight to a product
	   lands on that product once the form is answered. */
	const next = $derived(page.url.searchParams.get('next') || SHOP);
</script>

<svelte:head>
	<title>Before you look around · Dukkan</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<!-- Its own page, outside the shop's layout on purpose: a gate that renders
     inside the header, the categories and the cart is not a gate. Nothing of
     the demo is visible until the form is answered. -->
<div class="flex min-h-screen flex-col bg-surface-alt">
	<main class="flex flex-1 items-center justify-center px-4 py-12">
		<div class="w-full max-w-xl rounded-3xl border border-border bg-surface p-8 sm:p-10">
			<!-- The wordmark, not the orb: the orb means the assistant, and this
			     door has nothing to do with it. -->
			<div class="text-center">
				<span class="inline-flex items-center gap-2.5">
					<span
						class="grid size-9 place-items-center rounded-xl bg-primary text-[0.9375rem] font-semibold text-white"
						aria-hidden="true">D</span
					>
					<span class="text-lg font-semibold tracking-tight text-ink">Dukkan</span>
				</span>

				<h1 class="mt-6 text-2xl font-semibold tracking-tight text-ink">Who are we talking to?</h1>
				<p class="mx-auto mt-3 max-w-md text-sm text-ink-muted">
					Behind this door is a real shop with real orders in it, and the admin that runs it. Leave
					a number and it opens — we will call you about setting one up for yourself.
				</p>
			</div>

			<div class="mt-8">
				<LeadForm error={form?.error} field={form?.field} {next} />
			</div>
		</div>
	</main>

	<footer class="px-6 py-6 text-center text-xs text-ink-faint">
		<a href="/" class="rounded hover:text-ink-muted">Back to what this is</a>
	</footer>
</div>
