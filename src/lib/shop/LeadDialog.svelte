<script lang="ts">
	import { onMount } from 'svelte';
	import Dialog from '$lib/ui/Dialog.svelte';
	import LeadForm from './LeadForm.svelte';

	/**
	 * Asks who is looking, once.
	 *
	 * The server decides whether to ask — it holds the cookie — and this only
	 * decides when. A dialog in someone's face before the page has painted
	 * reads as a wall; a moment later, after they have seen there is a real
	 * shop behind it, reads as a question. Either button sets the cookie, so
	 * nobody is asked twice.
	 */
	let { ask = false }: { ask?: boolean } = $props();

	let open = $state(false);

	onMount(() => {
		if (!ask) return;
		const t = setTimeout(() => (open = true), 1200);
		return () => clearTimeout(t);
	});
</script>

{#if ask}
	<Dialog
		bind:open
		title="Who are we talking to?"
		description="This is a real shop with real orders in it, and you are welcome to look around. Leave a number and we will call you about setting one up for yourself."
		width="lg"
	>
		<LeadForm />
	</Dialog>
{/if}
