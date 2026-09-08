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
		size = 'standard',
		compared = false
	}: {
		product: CardProduct;
		size?: 'compact' | 'standard' | 'feature';
		compared?: boolean;
	} = $props();

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
				<button
					class="grid size-9 place-items-center rounded-xl border border-border text-ink-faint transition-colors hover:border-brand-300 hover:text-sale"
					aria-label="Add {product.title} to wishlist"
				>
					<Heart size={16} />
				</button>
				<form method="POST" action="/compare?/toggle" use:enhance>
					<input type="hidden" name="productId" value={product.id} />
					<input type="hidden" name="redirectTo" value={page.url.pathname + page.url.search} />
					<button
						class="grid size-9 place-items-center rounded-xl border border-border transition-colors
						       hover:border-brand-300 {compared ? 'text-primary' : 'text-ink-faint hover:text-primary'}"
						aria-label={compared
							? `Remove ${product.title} from comparison`
							: `Compare ${product.title}`}
					>
						<Scale size={16} />
					</button>
				</form>
			</div>
		</div>
	</article>
{:else}
	<article
		class="group relative flex flex-col gap-2 rounded-3xl border border-border bg-surface transition-[border-color,transform]
		       duration-[180ms] ease-brand hover:-translate-y-0.5 hover:border-brand-200
		       {size === 'compact' ? 'flex-row items-center gap-3 p-3' : 'p-3'}"
	>
		<a href="/p/{product.slug}" class="contents">
			{@render media(size === 'compact' ? 'size-16 rounded-xl' : 'aspect-square w-full')}
		</a>

		<div class="flex min-w-0 flex-1 flex-col gap-1.5 {size === 'compact' ? '' : 'px-1 pb-1'}">
			<a
				href="/p/{product.slug}"
				class="line-clamp-2 text-sm text-ink transition-colors hover:text-primary"
			>
				{product.title}
			</a>
			<Rating rating={product.rating} count={product.reviewCount} size={12} />
			{@render price()}
		</div>

		{#if size !== 'compact'}
			<button
				class="absolute top-4 right-4 grid size-8 place-items-center rounded-lg bg-surface/80
				       text-ink-faint backdrop-blur-sm transition-colors hover:text-sale"
				aria-label="Add {product.title} to wishlist"
			>
				<Heart size={16} />
			</button>
		{/if}
	</article>
{/if}
