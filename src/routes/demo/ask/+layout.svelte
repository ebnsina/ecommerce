<script lang="ts">
	import { ArrowLeft, PanelLeft } from '@lucide/svelte';
	import { SHOP } from '$lib/paths';
	import ChatSidebar from '$lib/shop/ChatSidebar.svelte';

	let { data, children } = $props();

	let listOpen = $state(false);
</script>

<svelte:head>
	<!-- eslint-disable-next-line svelte/no-at-html-tags -- CSS generated from the theme tokens on the server, not user input -->
	{@html `<style>${data.themeCss}</style>`}
</svelte:head>

<!-- A conversation gets the whole window and nothing else: no category bar, no
     promo strip, no footer. The height is fixed to the viewport and the thread
     scrolls inside it, which is what stops an answer from arriving below the
     fold of a page that itself looks still. `dvh`, so the bar on a phone
     browser cannot cover the composer. -->
<div class="flex h-dvh bg-page">
	<ChatSidebar threads={data.threads} bind:open={listOpen} />

	<div class="flex min-w-0 flex-1 flex-col">
		<header class="flex h-14 shrink-0 items-center gap-1 px-4">
			<button
				class="grid size-9 place-items-center rounded-lg text-ink-muted transition-colors hover:text-ink lg:hidden"
				aria-label="Your conversations"
				aria-expanded={listOpen}
				onclick={() => (listOpen = true)}
			>
				<PanelLeft size={18} />
			</button>
			<a
				href={SHOP}
				class="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-ink-muted transition-colors duration-[180ms] ease-brand hover:text-ink motion-reduce:transition-none"
			>
				<ArrowLeft size={16} aria-hidden="true" />
				Back to the shop
			</a>
			<span class="ml-auto text-sm font-medium text-ink">
				{data.store.logo?.text || data.store.name}
			</span>
		</header>

		{@render children()}
	</div>
</div>
