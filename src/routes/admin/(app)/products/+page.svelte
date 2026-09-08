<script lang="ts">
	import { untrack } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import {
		Plus,
		Search,
		Package,
		Star,
		Upload,
		Download,
		CircleCheck,
		PencilLine,
		Archive
	} from '@lucide/svelte';
	import { formatTk } from '$lib/money';
	import Button from '$lib/ui/Button.svelte';
	import Input from '$lib/ui/Input.svelte';
	import Select from '$lib/ui/Select.svelte';

	let { data } = $props();

	/* Seeded once from the URL, then owned by the form — untrack keeps them
	   from re-binding on every navigation. */
	let q = $state(untrack(() => data.filters.q));
	let status = $state(untrack(() => data.filters.status));
	let category = $state(untrack(() => data.filters.categoryId));

	/** One place that turns filter state into a URL — back/forward keeps working. */
	function apply(patch: Record<string, string>) {
		const params = new URLSearchParams(page.url.searchParams);
		for (const [k, v] of Object.entries(patch)) v ? params.set(k, v) : params.delete(k);
		params.delete('page');
		goto(`?${params}`, { keepFocus: true, noScroll: true });
	}

	let timer: ReturnType<typeof setTimeout>;
	function search(value: string) {
		clearTimeout(timer);
		timer = setTimeout(() => apply({ q: value }), 250);
	}

	/* Neutral tag, colour carried by the icon — same rule as the order status badge. */
	const statusTone: Record<string, { Icon: typeof CircleCheck; color: string }> = {
		active: { Icon: CircleCheck, color: 'var(--color-ok-fg)' },
		draft: { Icon: PencilLine, color: 'var(--color-ink-faint)' },
		archived: { Icon: Archive, color: 'var(--color-bad-fg)' }
	};
</script>

<svelte:head><title>Products · Admin</title></svelte:head>

<div class="flex flex-wrap items-start justify-between gap-4">
	<div>
		<h1 class="text-2xl font-semibold tracking-tight text-ink">Products</h1>
		<p class="mt-1 text-sm text-ink-muted">
			<span class="num">{data.total}</span>
			{data.total === 1 ? 'product' : 'products'}
			{#if data.filters.lowStock}· showing low stock only{/if}
		</p>
	</div>
	<div class="flex flex-wrap gap-2">
		<Button variant="secondary" href="/admin/products/export{page.url.search}">
			<Download size={16} />
			Export
		</Button>
		<Button variant="secondary" href="/admin/products/import">
			<Upload size={16} />
			Import
		</Button>
		<Button href="/admin/products/new">
			<Plus size={16} />
			New product
		</Button>
	</div>
</div>

<!-- Filters in one row above the table -->
<div class="mt-6 flex flex-wrap items-end gap-3">
	<div class="relative min-w-56 flex-1">
		<Input
			label="Search"
			placeholder="Title or slug"
			bind:value={q}
			oninput={(e) => search(e.currentTarget.value)}
			class="[&_input]:pl-9"
		/>
		<Search size={15} class="pointer-events-none absolute bottom-3.5 left-3 text-ink-faint" />
	</div>
	<Select
		label="Status"
		bind:value={status}
		options={[
			{ value: '', label: 'All statuses' },
			{ value: 'active', label: 'Active' },
			{ value: 'draft', label: 'Draft' },
			{ value: 'archived', label: 'Archived' }
		]}
		class="w-44"
		onchange={(v) => apply({ status: v })}
	/>
	<Select
		label="Category"
		bind:value={category}
		options={[
			{ value: '', label: 'All categories' },
			...data.categories.map((c) => ({ value: c.id, label: c.name }))
		]}
		class="w-52"
	/>
	<Button variant="secondary" onclick={() => apply({ status, category })}>Apply</Button>
</div>

<div class="mt-4 overflow-hidden rounded-3xl border border-border bg-surface">
	<div class="overflow-x-auto">
		<table class="w-full text-sm">
			<thead>
				<tr class="border-b border-border text-left text-xs text-ink-muted">
					<th class="px-4 py-3 font-medium">Product</th>
					<th class="px-4 py-3 font-medium">Status</th>
					<th class="px-4 py-3 text-right font-medium">Price</th>
					<th class="px-4 py-3 text-right font-medium">Stock</th>
				</tr>
			</thead>
			<tbody>
				{#each data.rows as p (p.id)}
					{@const tone = statusTone[p.status] ?? statusTone.draft}
					<tr class="border-b border-border transition-colors last:border-0 hover:bg-surface-alt">
						<td class="px-4 py-3">
							<a href="/admin/products/{p.id}" class="flex items-center gap-3">
								{#if p.image}
									<img
										src={p.image}
										alt=""
										class="size-10 shrink-0 rounded-xl border border-border object-cover"
									/>
								{:else}
									<span
										class="grid size-10 shrink-0 place-items-center rounded-xl bg-surface-alt text-ink-faint"
									>
										<Package size={16} />
									</span>
								{/if}
								<span class="min-w-0">
									<span class="flex items-center gap-1.5 truncate font-medium text-ink">
										{p.title}
										{#if p.featured}<Star size={13} class="shrink-0 text-star" />{/if}
									</span>
									<span class="block truncate text-xs text-ink-faint">/{p.slug}</span>
								</span>
							</a>
						</td>
						<td class="px-4 py-3">
							<span
								class="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2 py-0.5 text-xs font-medium text-ink capitalize"
							>
								<tone.Icon size={13} class="shrink-0" style="color: {tone.color}" />
								{p.status}
							</span>
						</td>
						<td class="px-4 py-3 text-right">
							<span class="num font-medium text-ink">{formatTk(p.price)}</span>
							{#if p.compareAtPrice && p.compareAtPrice > p.price}
								<span class="num block text-xs text-ink-faint line-through">
									{formatTk(p.compareAtPrice)}
								</span>
							{/if}
						</td>
						<td class="px-4 py-3 text-right">
							{#if p.hasVariants}
								<span class="text-xs text-ink-muted">By variant</span>
							{:else}
								<span class="num font-medium {p.stock <= 5 ? 'text-sale' : 'text-ink'}"
									>{p.stock}</span
								>
							{/if}
						</td>
					</tr>
				{:else}
					<tr>
						<td colspan="4" class="px-4 py-16 text-center text-ink-faint">
							No products match. Try clearing the filters.
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>

{#if data.pages > 1}
	<div class="mt-4 flex items-center justify-between">
		<p class="text-sm text-ink-muted">
			Page <span class="num">{data.page}</span> of <span class="num">{data.pages}</span>
		</p>
		<div class="flex gap-2">
			<Button
				size="sm"
				variant="secondary"
				disabled={data.page <= 1}
				onclick={() => apply({ page: String(data.page - 1) })}
			>
				Previous
			</Button>
			<Button
				size="sm"
				variant="secondary"
				disabled={data.page >= data.pages}
				onclick={() => apply({ page: String(data.page + 1) })}
			>
				Next
			</Button>
		</div>
	</div>
{/if}
