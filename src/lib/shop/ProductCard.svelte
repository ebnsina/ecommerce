<script lang="ts">
	import { Heart, ShoppingBag, Scale } from '@lucide/svelte';
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import { formatTk, discountPercent } from '$lib/money';
	import Rating from './Rating.svelte';
	import Button from '$lib/ui/Button.svelte';

	export type CardProduct = {
		id: string;
		title: string;
		slug: string;
		price: number;
		compareAtPrice: number | null;
		image: string | null;
		rating: number;
		reviewCount: number;
		stock: number;
		hasVariants: boolean;
	};

	let {
		product,
		size = 'standard'
	}: {
		product: CardProduct;
		size?: 'compact' | 'standard' | 'feature';
	} = $props();

	/* Read from the layout's data rather than passed down: every grid on the
	   site renders this card, and threading the shortlist through all of them
	   is how half of them end up not showing it. */
	const compared = $derived(((page.data.compareIds as string[]) ?? []).includes(product.id));
	const saved = $derived(((page.data.wishlistIds as string[]) ?? []).includes(product.id));

	const off = $derived(discountPercent(product.price, product.compareAtPrice));
	const soldOut = $derived(!product.hasVariants && product.stock <= 0);
</script>

{#snippet media(cls: string)}
	<span class="relative block shrink-0 overflow-hidden rounded-2xl bg-surface-alt {cls}">
		{#if product.image}
			<img
				src={product.image}
				alt=""
				loading="lazy"
				class="size-full object-cover transition-transform duration-[280ms] ease-brand group-hover:scale-[1.03]"
			/>
		{/if}
		{#if off > 0}
			<span
				class="num absolute top-2 left-2 rounded-lg bg-sale px-1.5 py-0.5 text-[11px] font-semibold text-white"
			>
				-{off}%
			</span>
		{/if}
		{#if soldOut}
			<span
				class="absolute inset-0 grid place-items-center bg-ink/60 text-xs font-medium text-white"
			>
				Out of stock
			</span>
		{/if}
	</span>
{/snippet}

{#snippet wishlistButton(cls: string)}
	<form method="POST" action="/cart?/wishlist" use:enhance>
		<input type="hidden" name="productId" value={product.id} />
		<input type="hidden" name="redirectTo" value={page.url.pathname + page.url.search} />
		<button
			class="grid place-items-center transition-colors {cls}
			       {saved ? 'text-sale' : 'text-ink-faint hover:text-sale'}"
			aria-label={saved ? `Remove ${product.title} from your wishlist` : `Save ${product.title}`}
			aria-pressed={saved}
		>
			<Heart size={16} class={saved ? 'fill-sale' : ''} />
		</button>
	</form>
{/snippet}

{#snippet compareButton(cls: string)}
	<form method="POST" action="/compare?/toggle" use:enhance>
		<input type="hidden" name="productId" value={product.id} />
		<input type="hidden" name="redirectTo" value={page.url.pathname + page.url.search} />
		<button
			class="grid place-items-center transition-colors {cls}
			       {compared ? 'text-primary' : 'text-ink-faint hover:text-primary'}"
			aria-label={compared ? `Remove ${product.title} from comparison` : `Compare ${product.title}`}
			aria-pressed={compared}
		>
			<Scale size={16} />
		</button>
	</form>
{/snippet}

{#snippet price()}
	<span class="flex flex-wrap items-baseline gap-1.5">
		<span class="num font-semibold text-ink">{formatTk(product.price)}</span>
		{#if off > 0 && product.compareAtPrice}
			<span class="num text-xs text-ink-faint line-through">{formatTk(product.compareAtPrice)}</span
			>
		{/if}
	</span>
{/snippet}

{#if size === 'feature'}
	<article
		class="group flex gap-4 rounded-3xl border border-border bg-surface p-4 transition-colors duration-[180ms] ease-brand hover:border-brand-200"
	>
		<a href="/p/{product.slug}" class="shrink-0">{@render media('size-36 sm:size-44')}</a>
		<div class="flex min-w-0 flex-1 flex-col gap-2">
			<a
				href="/p/{product.slug}"
				class="line-clamp-3 text-sm font-medium text-ink transition-colors hover:text-primary"
			>
				{product.title}
			</a>
			<Rating rating={product.rating} count={product.reviewCount} />
			{@render price()}
			<div class="mt-auto flex items-center gap-2">
				<Button href="/p/{product.slug}" size="sm" variant="secondary" disabled={soldOut}>
					<ShoppingBag size={15} />
					Buy now
				</Button>
				{@render wishlistButton('size-9 rounded-xl border border-border hover:border-brand-300')}
				{@render compareButton('size-9 rounded-xl border border-border hover:border-brand-300')}
			</div>
		</div>
	</article>
{:else}
	<!-- The hover target keeps still; only the inner card moves. Lifting the
	     element that carries :hover makes it slip out from under the pointer at
	     its own edge, which reads as flicker. -->
	<article class="group relative">
		<div
			class="flex h-full flex-col gap-2 rounded-3xl border border-border bg-surface
			       transition-[border-color,transform] duration-[180ms] ease-brand
			       group-hover:-translate-y-0.5 group-hover:border-brand-200
			       motion-reduce:transform-none motion-reduce:transition-none
			       {size === 'compact' ? 'flex-row items-center gap-3 p-3' : 'p-3'}"
		>
			<a href="/p/{product.slug}" class="contents">
				{@render media(
					size === 'compact' ? 'size-16 rounded-xl' : 'aspect-square w-full rounded-2xl'
				)}
			</a>

			<div class="flex min-w-0 flex-1 flex-col gap-1.5">
				<a
					href="/p/{product.slug}"
					class="line-clamp-2 text-sm text-ink transition-colors hover:text-primary"
				>
					{product.title}
				</a>
				<Rating rating={product.rating} count={product.reviewCount} size={12} />
				{@render price()}
				{#if !product.hasVariants && product.stock > 0 && product.stock <= 5}
					<span class="num text-xs font-medium text-sale">Only {product.stock} left</span>
				{/if}
			</div>
		</div>

		{#if size !== 'compact'}
			<!-- Outside the lifting wrapper, so the buttons stay under the pointer. -->
			<div class="absolute top-4 right-4 flex flex-col gap-1.5">
				{@render wishlistButton('size-8 rounded-lg bg-surface/80 backdrop-blur-sm')}
				{@render compareButton('size-8 rounded-lg bg-surface/80 backdrop-blur-sm')}
			</div>
		{/if}
	</article>
{/if}
