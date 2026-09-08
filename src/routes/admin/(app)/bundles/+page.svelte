<script lang="ts">
	import { enhance } from '$app/forms';
	import { Plus, PackagePlus, Power, Trash2, TriangleAlert } from '@lucide/svelte';
	import { formatTk } from '$lib/money';
	import Button from '$lib/ui/Button.svelte';
	import Input from '$lib/ui/Input.svelte';
	import Dialog from '$lib/ui/Dialog.svelte';

	let { data, form } = $props();
	let open = $state(false);
</script>

<svelte:head><title>Bundles · Admin</title></svelte:head>

<div class="flex flex-wrap items-start justify-between gap-4">
	<div>
		<h1 class="text-2xl font-semibold tracking-tight text-ink">Bundles</h1>
		<p class="mt-1 text-sm text-ink-muted">
			Sets of products sold together for one price. They appear on the product pages of everything
			they contain.
		</p>
	</div>
	<Button onclick={() => (open = true)}>
		<Plus size={16} />
		New bundle
	</Button>
</div>

{#if form?.error}
	<p
		class="mt-4 rounded-2xl border border-sale/30 bg-sale/8 px-4 py-3 text-sm text-sale"
		role="alert"
	>
		{form.error}
	</p>
{/if}

<div class="mt-6 overflow-hidden rounded-3xl border border-border bg-surface">
	{#each data.list as b (b.id)}
		<div class="flex flex-wrap items-center gap-4 border-b border-border px-4 py-3 last:border-0">
			<span class="size-11 shrink-0 overflow-hidden rounded-xl bg-surface-alt">
				{#if b.image}<img src={b.image} alt="" class="size-full object-cover" />{/if}
			</span>

			<a href="/admin/bundles/{b.id}" class="min-w-40 flex-1">
				<span class="block text-sm font-medium text-ink">{b.title}</span>
				<span class="block text-xs text-ink-faint">
					<span class="num">{b.items.length}</span> products
					{#if !b.inStock && b.items.length}· part out of stock{/if}
				</span>
			</a>

			<span class="min-w-32">
				<span class="num block text-sm font-semibold text-ink">{formatTk(b.price)}</span>
				{#if b.saving > 0}
					<span class="num block text-xs text-success">saves {formatTk(b.saving)}</span>
				{/if}
			</span>

			{#if b.items.length < 2}
				<span class="flex items-center gap-1.5 text-xs text-star">
					<TriangleAlert size={13} />
					Needs 2+ products
				</span>
			{/if}

			<span class="ml-auto flex items-center gap-1">
				<form method="POST" action="?/toggle" use:enhance>
					<input type="hidden" name="id" value={b.id} />
					<button
						class="grid size-8 place-items-center rounded-lg transition-colors
						       {data.list.find((x) => x.id === b.id) && b.items.length >= 2
							? 'text-ink-faint hover:bg-surface-alt hover:text-ink'
							: 'text-ink-faint'}"
						aria-label="Toggle {b.title}"
					>
						<Power size={15} />
					</button>
				</form>
				<form method="POST" action="?/remove" use:enhance>
					<input type="hidden" name="id" value={b.id} />
					<button
						class="grid size-8 place-items-center rounded-lg text-ink-faint transition-colors hover:bg-sale/8 hover:text-sale"
						aria-label="Delete {b.title}"
					>
						<Trash2 size={15} />
					</button>
				</form>
			</span>
		</div>
	{:else}
		<div class="flex flex-col items-center gap-3 px-6 py-16">
			<PackagePlus size={24} class="text-ink-faint" />
			<p class="text-sm text-ink-muted">No bundles yet.</p>
		</div>
	{/each}
</div>

<Dialog bind:open title="New bundle">
	<form id="bundle-form" method="POST" action="?/create" use:enhance class="flex flex-col gap-4">
		<Input label="Name" name="title" required placeholder="Breakfast essentials" />
	</form>
	{#snippet footer()}
		<Button variant="secondary" onclick={() => (open = false)}>Cancel</Button>
		<Button type="submit" form="bundle-form">Create</Button>
	{/snippet}
</Dialog>
