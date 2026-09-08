<script lang="ts">
	import { untrack } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { Star, X } from '@lucide/svelte';
	import Checkbox from '$lib/ui/Checkbox.svelte';
	import Button from '$lib/ui/Button.svelte';

	/**
	 * The filter panel. Every choice is a query parameter, so a filtered view is
	 * a link a shopper can send, keep, or come back to — and the database does
	 * the filtering, not the browser.
	 */
	let {
		facets,
		filters
	}: {
		facets: {
			categories: { id: string; name: string; slug: string }[];
			brands: string[];
			priceMin: number;
			priceMax: number;
		};
		filters: {
			categories: string[];
			brands: string[];
			min: string;
			max: string;
			rating: number;
			stock: boolean;
			sale: boolean;
		};
	} = $props();

	/* The price boxes are typed into, so they are held locally and applied on
	   submit — re-running the search on every keystroke would fight the typing. */
	let min = $state(untrack(() => filters.min));
	let max = $state(untrack(() => filters.max));
	/* Follow the URL when it changes from elsewhere — a cleared filter, the back
	   button — without fighting what is being typed. */
	$effect(() => {
		min = filters.min;
		max = filters.max;
	});

	function apply(patch: Record<string, string | string[] | null>) {
		const params = new URLSearchParams(page.url.searchParams);
		for (const [key, value] of Object.entries(patch)) {
			params.delete(key);
			for (const v of Array.isArray(value) ? value : [value]) if (v) params.append(key, v);
		}
		// Any change of filter returns to the first page: page 7 of a narrower
		// result set is usually empty, which reads as a broken search.
		params.delete('page');
		const qs = params.toString();
		goto(qs ? `?${qs}` : page.url.pathname, { keepFocus: true, noScroll: true });
	}

	const toggle = (list: string[], value: string) =>
		list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

	const activeCount = $derived(
		filters.categories.length +
			filters.brands.length +
			(filters.min ? 1 : 0) +
			(filters.max ? 1 : 0) +
			(filters.rating ? 1 : 0) +
			(filters.stock ? 1 : 0) +
			(filters.sale ? 1 : 0)
	);

	function clearAll() {
		const params = new URLSearchParams();
		const q = page.url.searchParams.get('q');
		if (q) params.set('q', q);
		goto(params.toString() ? `?${params}` : page.url.pathname, { noScroll: true });
	}
</script>

<div class="flex flex-col gap-6">
	{#if activeCount}
		<div class="flex items-center justify-between gap-2">
			<p class="text-sm text-ink-muted">
				<span class="num">{activeCount}</span>
				{activeCount === 1 ? 'filter' : 'filters'} on
			</p>
			<button
				class="flex items-center gap-1 text-xs text-ink-muted underline transition-colors hover:text-ink"
				onclick={clearAll}
			>
				<X size={13} />
				Clear all
			</button>
		</div>
	{/if}

	<fieldset>
		<legend class="mb-3 text-xs font-semibold tracking-wide text-ink uppercase">Category</legend>
		<div class="flex max-h-64 flex-col gap-2.5 overflow-y-auto">
			{#each facets.categories as c (c.id)}
				<Checkbox
					label={c.name}
					checked={filters.categories.includes(c.slug)}
					onchange={() => apply({ category: toggle(filters.categories, c.slug) })}
				/>
			{/each}
		</div>
	</fieldset>

	<fieldset>
		<legend class="mb-3 text-xs font-semibold tracking-wide text-ink uppercase">Price (৳)</legend>
		<form
			class="flex items-center gap-2"
			onsubmit={(e) => {
				e.preventDefault();
				apply({ min, max });
			}}
		>
			<input
				type="number"
				inputmode="numeric"
				bind:value={min}
				min={facets.priceMin}
				max={facets.priceMax}
				placeholder={String(facets.priceMin)}
				aria-label="Lowest price in taka"
				class="num h-10 w-full min-w-0 rounded-xl border border-border bg-surface px-3 text-sm text-ink"
			/>
			<span class="text-ink-faint">–</span>
			<input
				type="number"
				inputmode="numeric"
				bind:value={max}
				min={facets.priceMin}
				max={facets.priceMax}
				placeholder={String(facets.priceMax)}
				aria-label="Highest price in taka"
				class="num h-10 w-full min-w-0 rounded-xl border border-border bg-surface px-3 text-sm text-ink"
			/>
			<Button type="submit" size="sm" variant="secondary">Go</Button>
		</form>
	</fieldset>

	<fieldset>
		<legend class="mb-3 text-xs font-semibold tracking-wide text-ink uppercase">Rating</legend>
		<div class="flex flex-col gap-1">
			{#each [4, 3, 2] as stars (stars)}
				<button
					class="flex items-center gap-2 rounded-xl px-2 py-1.5 text-left text-sm transition-colors
					       duration-[180ms] ease-brand
					       {filters.rating === stars
						? 'bg-track font-medium text-ink'
						: 'text-ink-muted hover:text-ink'}"
					aria-pressed={filters.rating === stars}
					onclick={() => apply({ rating: filters.rating === stars ? null : String(stars) })}
				>
					<span class="flex" aria-hidden="true">
						{#each Array(5) as _, i (i)}
							<Star size={13} class={i < stars ? 'fill-star text-star' : 'text-border'} />
						{/each}
					</span>
					<span class="num">{stars}</span> and up
				</button>
			{/each}
		</div>
	</fieldset>

	{#if facets.brands.length}
		<fieldset>
			<legend class="mb-3 text-xs font-semibold tracking-wide text-ink uppercase">Brand</legend>
			<div class="flex max-h-64 flex-col gap-2.5 overflow-y-auto">
				{#each facets.brands as brand (brand)}
					<Checkbox
						label={brand}
						checked={filters.brands.includes(brand)}
						onchange={() => apply({ brand: toggle(filters.brands, brand) })}
					/>
				{/each}
			</div>
		</fieldset>
	{/if}

	<fieldset>
		<legend class="mb-3 text-xs font-semibold tracking-wide text-ink uppercase">Availability</legend
		>
		<div class="flex flex-col gap-2.5">
			<Checkbox
				label="In stock only"
				checked={filters.stock}
				onchange={() => apply({ stock: filters.stock ? null : '1' })}
			/>
			<Checkbox
				label="On offer"
				checked={filters.sale}
				onchange={() => apply({ sale: filters.sale ? null : '1' })}
			/>
		</div>
	</fieldset>
</div>
