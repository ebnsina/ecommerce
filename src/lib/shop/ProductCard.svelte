<script lang="ts">
	import { Heart, ShoppingBag, Scale, Plus } from '@lucide/svelte';
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import { formatTk, discountPercent } from '$lib/money';
	import { track } from '$lib/track';
	import Rating from './Rating.svelte';
	import Img from './Img.svelte';
	import Button from '$lib/ui/Button.svelte';
	import Stepper from './Stepper.svelte';
	import { layoutOf, type CardShape } from '$lib/layouts';

	export type CardProduct = {
		id: string;
		title: string;
		slug: string;
		price: number;
		compareAtPrice: number | null;
		image: string | null;
		brand?: string | null;
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

	/* The shop's layout decides the card's proportions — square, dense, portrait
	   or a row — the same way it decides how many fit across. Read from the
	   layout data rather than passed in, for the reason the shortlist above is:
	   every grid on the site renders this card. `compact` and `feature` are
	   asked for explicitly by a caller and still win. */
	const shape = $derived<CardShape | 'compact' | 'feature'>(
		size === 'standard' ? layoutOf(page.data.layout as string).card : size
	);

	const off = $derived(discountPercent(product.price, product.compareAtPrice));
	const soldOut = $derived(!product.hasVariants && product.stock <= 0);
</script>

{#snippet media(cls: string)}
	<span class="relative block shrink-0 overflow-hidden rounded-2xl bg-surface-alt {cls}">
		{#if product.image}
			<Img
				src={product.image}
				width={480}
				height={480}
				sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 260px"
				class="size-full object-cover transition-transform duration-[280ms] ease-brand group-hover:scale-[1.03] motion-reduce:transition-none"
			/>
		{/if}
		{#if off > 0}
			<span
				class="num absolute top-2.5 left-2.5 rounded-lg bg-surface/95 px-2 py-0.5 text-[11px]
				       font-semibold text-sale backdrop-blur-sm"
			>
				−{off}%
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

{#snippet quickAdd(compactAdd = false)}
	<form
		method="POST"
		action="/demo/cart?/add"
		use:enhance={() =>
			async ({ result, update }) => {
				if (result.type !== 'failure' && result.type !== 'error')
					track({
						kind: 'add_to_cart',
						value: product.price,
						items: [{ id: product.id, name: product.title, price: product.price, quantity: 1 }]
					});
				await update();
			}}
	>
		<input type="hidden" name="productId" value={product.id} />
		<input type="hidden" name="qty" value="1" />
		<input type="hidden" name="redirectTo" value={page.url.pathname + page.url.search} />
		<button
			disabled={soldOut}
			class="flex items-center justify-center gap-1.5 rounded-xl border border-border
			       {compactAdd ? 'size-9' : 'h-10 w-full'}
			       bg-surface text-sm font-medium text-ink transition-colors duration-[180ms] ease-brand
			       hover:border-primary hover:bg-primary hover:text-white
			       disabled:cursor-not-allowed disabled:text-ink-faint disabled:hover:border-border
			       disabled:hover:bg-surface disabled:hover:text-ink-faint"
		>
			{#if compactAdd}
				<!-- The grocer's card: a square button with a plus in it, because the
				     label would be wider than the card and every one of these is the
				     same action anyway. -->
				<Plus size={17} aria-hidden="true" />
				<span class="sr-only">{soldOut ? 'Out of stock' : `Add ${product.title} to cart`}</span>
			{:else}
				<ShoppingBag size={15} />
				{soldOut ? 'Out of stock' : 'Add to cart'}
			{/if}
		</button>
	</form>
{/snippet}

{#snippet wishlistButton(cls: string)}
	<form method="POST" action="/demo/cart?/wishlist" use:enhance>
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
	<form method="POST" action="/demo/compare?/toggle" use:enhance>
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
	<span class="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
		<span class="num text-base font-semibold tracking-tight text-ink">
			{formatTk(product.price)}
		</span>
		{#if off > 0 && product.compareAtPrice}
			<span class="num text-xs text-ink-faint line-through">
				{formatTk(product.compareAtPrice)}
			</span>
		{/if}
	</span>
{/snippet}

<!-- A parts dealer's row: picture, then what gets compared, then the price and
     the buttons in their own column at the right — the shape of a price list,
     which is what a shopper is reading here. The three columns are also why
     this fills a wide screen instead of leaving half of it blank. -->
{#if shape === 'row'}
	<article
		class="group flex gap-4 rounded-2xl border border-border bg-surface p-3 transition-colors duration-[180ms] ease-brand hover:border-brand-200 sm:gap-5 sm:p-4"
	>
		<a href="/demo/p/{product.slug}" class="shrink-0">{@render media('size-28 sm:size-32')}</a>

		<div class="flex min-w-0 flex-1 flex-col gap-1.5">
			<a
				href="/demo/p/{product.slug}"
				class="line-clamp-2 text-[0.9375rem] font-medium text-ink transition-colors hover:text-primary"
			>
				{product.title}
			</a>
			{#if product.brand}
				<p class="text-xs text-ink-muted">{product.brand}</p>
			{/if}
			<Rating rating={product.rating} count={product.reviewCount} size={12} />
			<p class="num mt-auto text-xs {soldOut ? 'text-ink-faint' : 'text-success'}">
				{soldOut ? 'Out of stock' : 'In stock'}
			</p>
		</div>

		<div
			class="flex w-36 shrink-0 flex-col items-end justify-between gap-2 border-l border-border pl-4 sm:w-44 sm:pl-5"
		>
			<span class="flex flex-col items-end">
				<span class="num text-lg font-semibold tracking-tight text-ink">
					{formatTk(product.price)}
				</span>
				{#if off > 0 && product.compareAtPrice}
					<span class="num text-xs text-ink-faint line-through">
						{formatTk(product.compareAtPrice)}
					</span>
				{/if}
			</span>

			<div class="flex w-full flex-col items-end gap-1.5">
				<div class="w-full">{@render quickAdd()}</div>
				<div class="flex gap-1">
					{@render wishlistButton('size-8 rounded-lg hover:bg-surface-alt')}
					{@render compareButton('size-8 rounded-lg hover:bg-surface-alt')}
				</div>
			</div>
		</div>
	</article>
{:else if shape === 'feature'}
	<article
		class="group flex gap-4 rounded-3xl border border-border bg-surface p-4 transition-colors duration-[180ms] ease-brand hover:border-brand-200"
	>
		<a href="/demo/p/{product.slug}" class="shrink-0">{@render media('size-36 sm:size-44')}</a>
		<div class="flex min-w-0 flex-1 flex-col gap-2">
			<a
				href="/demo/p/{product.slug}"
				class="line-clamp-3 text-sm font-medium text-ink transition-colors hover:text-primary"
			>
				{product.title}
			</a>
			<Rating rating={product.rating} count={product.reviewCount} />
			{@render price()}
			<div class="mt-auto flex items-center gap-2">
				<Button href="/demo/p/{product.slug}" size="sm" variant="secondary" disabled={soldOut}>
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
	<article class="group relative h-full">
		<div
			class="flex h-full flex-col gap-2 rounded-3xl border border-border bg-surface
			       transition-[border-color,transform] duration-[180ms] ease-brand
			       group-hover:-translate-y-0.5 group-hover:border-brand-200
			       motion-reduce:transform-none motion-reduce:transition-none
			       {shape === 'compact'
				? 'flex-row items-center gap-3 p-3'
				: shape === 'dense'
					? 'p-2.5'
					: 'p-3.5'}"
		>
			<a href="/demo/p/{product.slug}" class="contents">
				{@render media(
					shape === 'compact'
						? 'size-16 rounded-xl'
						: shape === 'portrait'
							? 'aspect-[2/3] w-full rounded-2xl'
							: 'aspect-square w-full rounded-2xl'
				)}
			</a>

			<div class="flex min-w-0 flex-1 flex-col gap-1.5">
				<!-- Two lines are reserved whether or not the title needs them, so the
				     rating, the price and the button below sit on the same line across
				     a row. A one-line title otherwise pulls its whole card up. -->
				<a
					href="/demo/p/{product.slug}"
					class="line-clamp-2 text-sm leading-snug font-medium text-ink transition-colors
					       duration-[180ms] ease-brand hover:text-primary
					       {shape === 'compact' ? '' : 'min-h-[2.6em]'}"
				>
					{product.title}
				</a>
				{#if shape === 'portrait' && product.brand}
					<!-- On a bookshop's shelf this is the author; everywhere else it is
					     the brand, which is why only the portrait card prints it. -->
					<span class="-mt-0.5 truncate text-xs text-ink-muted">{product.brand}</span>
				{/if}
				{#if shape !== 'dense'}
					<Rating rating={product.rating} count={product.reviewCount} size={12} />
				{/if}
				{@render price()}
				{#if !product.hasVariants && product.stock > 0 && product.stock <= 5}
					<span class="num text-xs font-medium text-sale">Only {product.stock} left</span>
				{/if}

				{#if shape === 'dense'}
					<!-- A plus until it is in the basket, then the quantity with a minus
					     beside it — the shopper never leaves the shelf to change their
					     mind about how much rice they want. -->
					<div class="mt-auto flex items-end justify-end pt-2">
						<Stepper productId={product.id} title={product.title} {soldOut} />
					</div>
				{:else if shape !== 'compact'}
					<!-- mt-auto, not a margin: "Only 2 left" appears on some cards and not
					     others, and the button has to ignore it and stay at the floor. -->
					<div class="mt-auto pt-2.5">{@render quickAdd()}</div>
				{/if}
			</div>
		</div>

		{#if shape !== 'compact' && shape !== 'dense'}
			<!-- Outside the lifting wrapper, so the buttons stay under the pointer. -->
			<div class="absolute top-4 right-4 flex flex-col gap-1.5">
				{@render wishlistButton('size-8 rounded-lg bg-surface/80 backdrop-blur-sm')}
				{@render compareButton('size-8 rounded-lg bg-surface/80 backdrop-blur-sm')}
			</div>
		{/if}
	</article>
{/if}
