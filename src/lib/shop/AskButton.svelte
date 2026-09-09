<script lang="ts">
	import { page } from '$app/state';
	import Orb from './Orb.svelte';
	import { SHOP, shop } from '$lib/paths';

	/**
	 * The way in to the assistant, bottom right.
	 *
	 * It was a link in the header, competing with search, the basket and the
	 * account for a bar that is already full. Down here it is the only thing in
	 * its corner, which is what makes a nav feel clean: fewer things in it, not
	 * smaller ones. No plate, no border, no word — a thing that moves in the
	 * corner of a shop is understood.
	 *
	 * It hides itself on the assistant's own page — a button that takes you
	 * where you already are is furniture.
	 */
	const here = $derived(page.url.pathname.startsWith(shop('/ask')));
</script>

{#if !here}
	<!-- The orb and nothing else. It carries no label, so the link does: the orb
	     itself is decoration and hidden from screen readers, and `aria-label` is
	     what a keyboard or a reader actually hears. -->
	<a
		href="{SHOP}/ask"
		aria-label="Ask for what you need"
		class="fixed right-4 bottom-4 z-30 rounded-full transition-transform duration-[180ms] ease-brand
		       hover:scale-105 motion-reduce:transform-none motion-reduce:transition-none
		       sm:right-6 sm:bottom-6"
	>
		<Orb size={56} />
	</a>
{/if}
