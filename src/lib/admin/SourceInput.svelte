<script lang="ts">
	import { X } from '@lucide/svelte';
	import type { ProductSource } from '$lib/blocks/schema';
	import Select from '$lib/ui/Select.svelte';
	import Input from '$lib/ui/Input.svelte';

	/** Where a product row gets its products: a rule, a category, or a hand-picked list. */
	let {
		value = $bindable(),
		categories,
		catalog,
		label
	}: {
		value: ProductSource;
		categories: { id: string; name: string; parentId: string | null }[];
		catalog: { id: string; title: string }[];
		label: string;
	} = $props();

	let search = $state('');

	const chosen = $derived(
		(value?.ids ?? []).map((id) => catalog.find((c) => c.id === id)).filter(Boolean)
	);
	const matches = $derived(
		search.trim()
			? catalog
					.filter(
						(c) =>
							c.title.toLowerCase().includes(search.toLowerCase()) && !value.ids?.includes(c.id)
					)
					.slice(0, 8)
			: []
	);
</script>

<div class="flex flex-col gap-3">
	<span class="text-sm font-medium text-ink">{label}</span>

	<Select
		bind:value={value.mode}
		options={[
			{ value: 'rule', label: 'Automatic', hint: 'Follows a rule, always current' },
			{ value: 'category', label: 'From a category' },
			{ value: 'manual', label: 'Hand-picked' }
		]}
	/>

	{#if value.mode === 'rule'}
		<Select
			bind:value={value.rule}
			options={[
				{ value: 'new-arrival', label: 'New arrivals' },
				{ value: 'best-seller', label: 'Best sellers' },
				{ value: 'top-rated', label: 'Top rated' },
				{ value: 'featured', label: 'Featured products' },
				{ value: 'hot-deal', label: 'Biggest discounts' }
			]}
		/>
	{:else if value.mode === 'category'}
		<Select
			bind:value={value.categoryId}
			placeholder="Choose a category"
			options={categories.map((c) => ({ value: c.id, label: c.parentId ? `— ${c.name}` : c.name }))}
		/>
	{:else}
		<div class="flex flex-col gap-2">
			{#each chosen as p (p!.id)}
				<div class="flex items-center gap-2 rounded-xl border border-border px-3 py-2">
					<span class="min-w-0 flex-1 truncate text-sm text-ink">{p!.title}</span>
					<button
						type="button"
						class="text-ink-faint hover:text-sale"
						aria-label="Remove {p!.title}"
						onclick={() => (value.ids = value.ids.filter((id) => id !== p!.id))}
					>
						<X size={14} />
					</button>
				</div>
			{/each}

			<Input
				bind:value={search}
				placeholder="Search products to add"
				aria-label="Search products"
			/>
			{#if matches.length}
				<ul class="flex flex-col rounded-xl border border-border p-1">
					{#each matches as m (m.id)}
						<li>
							<button
								type="button"
								class="w-full rounded-lg px-2.5 py-1.5 text-left text-sm text-ink hover:bg-surface-alt"
								onclick={() => {
									value.ids = [...(value.ids ?? []), m.id];
									search = '';
								}}
							>
								{m.title}
							</button>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	{/if}

	<Input label="How many to show" bind:value={value.limit} type="number" min="1" max="24" numeric />
</div>
