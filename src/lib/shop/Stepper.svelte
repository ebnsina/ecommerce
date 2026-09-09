<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import { Minus, Plus } from '@lucide/svelte';

	let {
		productId,
		title,
		soldOut = false,
		size = 'sm'
	}: {
		productId: string;
		/** For the accessible name — "Add rice", not "Add". */
		title: string;
		soldOut?: boolean;
		size?: 'sm' | 'md';
	} = $props();

	/* What is already in the basket, read from the shop layout's data the same
	   way the wishlist is. A card that shows a plus for something already in the
	   basket is how a grocery order ends up with four of everything. */
	const line = $derived(
		((page.data.cartLines as { id: string; productId: string; qty: number }[]) ?? []).find(
			(l) => l.productId === productId
		)
	);

	const redirectTo = $derived(page.url.pathname + page.url.search);
	const box = $derived(size === 'md' ? 'h-9' : 'h-8');
</script>

{#if line}
	<!-- Two forms rather than one with a hidden sign: each button posts the
	     quantity it means, so this works with JavaScript off. -->
	<div class="flex items-stretch overflow-hidden rounded-lg border border-primary {box}">
		<form method="POST" action="/demo/cart?/setQty" use:enhance>
			<input type="hidden" name="id" value={line.id} />
			<input type="hidden" name="qty" value={line.qty - 1} />
			<input type="hidden" name="redirectTo" value={redirectTo} />
			<button
				class="grid h-full w-8 place-items-center text-primary transition-colors hover:bg-primary-soft"
				aria-label={line.qty === 1 ? `Remove ${title}` : `One fewer ${title}`}
			>
				<Minus size={14} />
			</button>
		</form>

		<span class="num grid min-w-7 place-items-center px-1 text-sm font-semibold text-primary">
			{line.qty}
		</span>

		<form method="POST" action="/demo/cart?/setQty" use:enhance>
			<input type="hidden" name="id" value={line.id} />
			<input type="hidden" name="qty" value={line.qty + 1} />
			<input type="hidden" name="redirectTo" value={redirectTo} />
			<button
				class="grid h-full w-8 place-items-center text-primary transition-colors hover:bg-primary-soft"
				aria-label="One more {title}"
			>
				<Plus size={14} />
			</button>
		</form>
	</div>
{:else}
	<form method="POST" action="/demo/cart?/add" use:enhance>
		<input type="hidden" name="productId" value={productId} />
		<input type="hidden" name="qty" value="1" />
		<input type="hidden" name="redirectTo" value={redirectTo} />
		<button
			disabled={soldOut}
			class="grid place-items-center rounded-lg border border-border bg-surface text-ink transition-colors
			       hover:border-primary hover:bg-primary hover:text-white
			       disabled:cursor-not-allowed disabled:text-ink-faint disabled:hover:border-border
			       disabled:hover:bg-surface disabled:hover:text-ink-faint {box} w-full min-w-8"
			aria-label={soldOut ? `${title} is out of stock` : `Add ${title} to the basket`}
		>
			<Plus size={16} aria-hidden="true" />
		</button>
	</form>
{/if}
