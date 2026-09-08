<script lang="ts">
	import { Search, TrendingUp, Eye, PackageX, TriangleAlert } from '@lucide/svelte';
	import { formatTk } from '$lib/money';
	import Select from '$lib/ui/Select.svelte';
	import PageHeader from '$lib/admin/PageHeader.svelte';
	import { setParams } from '$lib/admin/listQuery';
	import { shop } from '$lib/paths';

	let { data } = $props();

	const pct = (n: number) => `${Math.round(n * 100)}%`;

	/* Interest without sales is the number worth acting on: people found it and
	   walked away. Products nobody has seen are a different problem. */
	const missed = $derived(
		data.interest
			.filter((p) => p.views >= 5 && p.sold === 0)
			.sort((a, b) => b.views - a.views)
			.slice(0, 10)
	);
</script>

<svelte:head><title>Insights · Admin</title></svelte:head>

<PageHeader
	title="Insights"
	description="What shoppers looked for, what they looked at, and what they actually bought."
>
	{#snippet actions()}
		<Select
			value={String(data.days)}
			class="w-40"
			options={[
				{ value: '7', label: 'Last 7 days' },
				{ value: '30', label: 'Last 30 days' },
				{ value: '90', label: 'Last 90 days' }
			]}
			onchange={(v) => setParams({ days: v })}
		/>
	{/snippet}
</PageHeader>

<!-- How orders end. In a cash-on-delivery market the return rate decides
     whether the shop makes money. -->
<div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
	{#each [{ label: 'Orders', value: String(data.rates.total), note: 'in this period' }, { label: 'Delivered', value: String(data.rates.delivered), note: data.rates.total ? pct(data.rates.delivered / data.rates.total) + ' of orders' : '—' }, { label: 'Returned', value: String(data.rates.returned), note: data.rates.total ? pct(data.rates.returned / data.rates.total) + ' of orders' : '—' }, { label: 'COD refused', value: pct(data.rates.codReturnRate), note: `of ${data.rates.cod} cash orders` }] as stat (stat.label)}
		<div class="rounded-3xl border border-border bg-surface p-5">
			<p class="text-xs font-semibold tracking-wide text-ink-muted uppercase">{stat.label}</p>
			<p class="num mt-2 text-2xl font-semibold text-ink">{stat.value}</p>
			<p class="mt-1 text-xs text-ink-faint">{stat.note}</p>
		</div>
	{/each}
</div>

<div class="mt-4 grid gap-4 lg:grid-cols-2">
	<!-- Demand with nothing behind it: the clearest buying signal there is. -->
	<section class="rounded-3xl border border-border bg-surface p-5">
		<h2 class="flex items-center gap-2 text-sm font-medium text-ink">
			<PackageX size={16} class="text-sale" />
			Searched for, and we had nothing
		</h2>
		<p class="mt-1 text-xs text-ink-muted">
			Every one of these is a shopper who wanted to spend money and could not.
		</p>
		<ul class="mt-4 flex flex-col">
			{#each data.unmet as row (row.term)}
				<li
					class="flex items-center justify-between gap-3 border-b border-border py-2 last:border-0"
				>
					<a
						href={shop(`/search?q=${encodeURIComponent(row.term)}`)}
						class="truncate text-sm text-ink"
					>
						{row.term}
					</a>
					<span class="num shrink-0 text-sm text-ink-muted">{row.searches}</span>
				</li>
			{:else}
				<li class="py-8 text-center text-sm text-ink-faint">
					Nothing yet — every search so far found something.
				</li>
			{/each}
		</ul>
	</section>

	<section class="rounded-3xl border border-border bg-surface p-5">
		<h2 class="flex items-center gap-2 text-sm font-medium text-ink">
			<Search size={16} class="text-primary" />
			Most searched
		</h2>
		<p class="mt-1 text-xs text-ink-muted">What people type into the search box.</p>
		<ul class="mt-4 flex flex-col">
			{#each data.searches as row (row.term)}
				<li
					class="flex items-center justify-between gap-3 border-b border-border py-2 last:border-0"
				>
					<a
						href={shop(`/search?q=${encodeURIComponent(row.term)}`)}
						class="truncate text-sm text-ink"
					>
						{row.term}
					</a>
					<span class="flex shrink-0 items-center gap-2">
						{#if row.empty > 0}
							<span class="flex items-center gap-1 text-xs text-sale">
								<TriangleAlert size={12} />
								<span class="num">{row.empty}</span> empty
							</span>
						{/if}
						<span class="num text-sm text-ink-muted">{row.searches}</span>
					</span>
				</li>
			{:else}
				<li class="py-8 text-center text-sm text-ink-faint">No searches recorded yet.</li>
			{/each}
		</ul>
	</section>

	<section class="rounded-3xl border border-border bg-surface p-5">
		<h2 class="flex items-center gap-2 text-sm font-medium text-ink">
			<Eye size={16} class="text-warn-fg" />
			Looked at, never bought
		</h2>
		<p class="mt-1 text-xs text-ink-muted">
			Shoppers found these and walked away. Usually the price, the photos or the stock.
		</p>
		<ul class="mt-4 flex flex-col">
			{#each missed as p (p.id)}
				<li
					class="flex items-center justify-between gap-3 border-b border-border py-2 last:border-0"
				>
					<a href="/demo/p/{p.slug}" class="min-w-0 flex-1 truncate text-sm text-ink">{p.title}</a>
					<span class="flex shrink-0 items-center gap-3 text-xs text-ink-muted">
						<span class="num">{p.views} views</span>
						<span class="num">{p.carts} carts</span>
						{#if p.stock === 0}
							<span class="text-sale">out of stock</span>
						{:else}
							<span class="num">{formatTk(p.price)}</span>
						{/if}
					</span>
				</li>
			{:else}
				<li class="py-8 text-center text-sm text-ink-faint">
					Nothing stands out — everything with visitors is selling.
				</li>
			{/each}
		</ul>
	</section>

	<section class="rounded-3xl border border-border bg-surface p-5">
		<h2 class="flex items-center gap-2 text-sm font-medium text-ink">
			<TrendingUp size={16} class="text-ok-fg" />
			Best sellers
		</h2>
		<p class="mt-1 text-xs text-ink-muted">Cancelled and returned orders are left out.</p>
		<ul class="mt-4 flex flex-col">
			{#each data.sellers as p (p.id)}
				<li
					class="flex items-center justify-between gap-3 border-b border-border py-2 last:border-0"
				>
					<a href="/demo/p/{p.slug}" class="min-w-0 flex-1 truncate text-sm text-ink">{p.title}</a>
					<span class="flex shrink-0 items-center gap-3 text-xs">
						<span class="num text-ink-muted">{p.units} sold</span>
						<span class="num font-medium text-ink">{formatTk(p.revenue)}</span>
					</span>
				</li>
			{:else}
				<li class="py-8 text-center text-sm text-ink-faint">No sales in this period.</li>
			{/each}
		</ul>
	</section>
</div>
