<script lang="ts">
	import { enhance } from '$app/forms';
	import { slide } from 'svelte/transition';
	import {
		Plus,
		Pencil,
		Trash2,
		ChevronUp,
		ChevronDown,
		Eye,
		EyeOff,
		FolderTree
	} from '@lucide/svelte';
	import { slugify } from '$lib/slug';
	import { slideOpen } from '$lib/motion';
	import Button from '$lib/ui/Button.svelte';
	import Input from '$lib/ui/Input.svelte';
	import Select from '$lib/ui/Select.svelte';
	import Checkbox from '$lib/ui/Checkbox.svelte';
	import Dialog from '$lib/ui/Dialog.svelte';
	import MediaPicker from '$lib/ui/MediaPicker.svelte';

	type Row = (typeof data)['flat'][number];

	let { data, form } = $props();

	let open = $state(false);
	let editing = $state<Row | null>(null);

	/* Form fields — one dialog serves create and edit. */
	let name = $state('');
	let nameBn = $state('');
	let slug = $state('');
	let parentId = $state('');
	let image = $state('');
	let visible = $state(true);
	let slugTouched = $state(false);

	const autoSlug = $derived(slugTouched ? slug : slugify(name));

	const parentOptions = $derived([
		{ value: '', label: 'None — top level' },
		...data.tree.filter((c) => c.id !== editing?.id).map((c) => ({ value: c.id, label: c.name }))
	]);

	function startCreate(parent = '') {
		editing = null;
		name = nameBn = slug = image = '';
		parentId = parent;
		visible = true;
		slugTouched = false;
		open = true;
	}

	function startEdit(row: Row) {
		editing = row;
		name = row.name;
		nameBn = row.nameBn ?? '';
		slug = row.slug;
		parentId = row.parentId ?? '';
		image = row.image ?? '';
		visible = row.visible;
		slugTouched = true;
		open = true;
	}
</script>

<svelte:head><title>Categories · Admin</title></svelte:head>

<div class="flex flex-wrap items-start justify-between gap-4">
	<div>
		<h1 class="text-2xl font-semibold tracking-tight text-ink">Categories</h1>
		<p class="mt-1 text-sm text-ink-muted">
			Two levels: a category and its subcategories. Order here is the order shoppers see.
		</p>
	</div>
	<Button onclick={() => startCreate()}>
		<Plus size={16} />
		New category
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

{#snippet row(c: Row, child: boolean)}
	<div
		class="flex items-center gap-3 px-4 py-3 {child ? 'pl-14' : ''}"
		class:opacity-55={!c.visible}
	>
		{#if c.image}
			<img
				src={c.image}
				alt=""
				class="size-9 shrink-0 rounded-xl border border-border object-cover"
			/>
		{:else}
			<span
				class="grid size-9 shrink-0 place-items-center rounded-xl bg-surface-alt text-ink-faint"
			>
				<FolderTree size={16} />
			</span>
		{/if}

		<div class="min-w-0 flex-1">
			<p class="truncate text-sm font-medium text-ink">
				{c.name}
				{#if c.nameBn}<span class="font-normal text-ink-muted"> · {c.nameBn}</span>{/if}
			</p>
			<p class="truncate text-xs text-ink-faint">
				/{c.slug} · <span class="num">{c.products}</span>
				{c.products === 1 ? 'product' : 'products'}
			</p>
		</div>

		<div class="flex shrink-0 items-center gap-1">
			<form method="POST" action="?/move" use:enhance>
				<input type="hidden" name="id" value={c.id} />
				<input type="hidden" name="dir" value="up" />
				<button
					class="grid size-8 place-items-center rounded-lg text-ink-faint transition-colors hover:bg-surface-alt hover:text-ink"
					aria-label="Move {c.name} up"
				>
					<ChevronUp size={16} />
				</button>
			</form>
			<form method="POST" action="?/move" use:enhance>
				<input type="hidden" name="id" value={c.id} />
				<input type="hidden" name="dir" value="down" />
				<button
					class="grid size-8 place-items-center rounded-lg text-ink-faint transition-colors hover:bg-surface-alt hover:text-ink"
					aria-label="Move {c.name} down"
				>
					<ChevronDown size={16} />
				</button>
			</form>
			<form method="POST" action="?/toggle" use:enhance>
				<input type="hidden" name="id" value={c.id} />
				<button
					class="grid size-8 place-items-center rounded-lg text-ink-faint transition-colors hover:bg-surface-alt hover:text-ink"
					aria-label={c.visible ? `Hide ${c.name}` : `Show ${c.name}`}
				>
					{#if c.visible}<Eye size={16} />{:else}<EyeOff size={16} />{/if}
				</button>
			</form>
			<button
				class="grid size-8 place-items-center rounded-lg text-ink-faint transition-colors hover:bg-surface-alt hover:text-ink"
				aria-label="Edit {c.name}"
				onclick={() => startEdit(c)}
			>
				<Pencil size={16} />
			</button>
			<form method="POST" action="?/remove" use:enhance>
				<input type="hidden" name="id" value={c.id} />
				<button
					class="grid size-8 place-items-center rounded-lg text-ink-faint transition-colors hover:bg-sale/8 hover:text-sale"
					aria-label="Delete {c.name}"
				>
					<Trash2 size={16} />
				</button>
			</form>
		</div>
	</div>
{/snippet}

<div class="mt-6 overflow-hidden rounded-3xl border border-border bg-surface">
	{#each data.tree as c (c.id)}
		<div class="border-b border-border last:border-0">
			{@render row(c, false)}
			{#each c.children as sub (sub.id)}
				<div class="border-t border-border">{@render row(sub, true)}</div>
			{/each}
			<div class="border-t border-border px-4 py-2 pl-14">
				<button
					class="inline-flex items-center gap-1.5 text-xs text-ink-muted transition-colors hover:text-primary"
					onclick={() => startCreate(c.id)}
				>
					<Plus size={14} />
					Add subcategory
				</button>
			</div>
		</div>
	{:else}
		<p class="px-4 py-16 text-center text-sm text-ink-faint">
			No categories yet. Create the first one to start organising the catalog.
		</p>
	{/each}
</div>

<Dialog bind:open title={editing ? 'Edit category' : 'New category'}>
	<form
		id="category-form"
		method="POST"
		action={editing ? '?/update' : '?/create'}
		use:enhance={() =>
			({ update }) => {
				open = false;
				return update();
			}}
		class="flex flex-col gap-4"
	>
		{#if editing}<input type="hidden" name="id" value={editing.id} />{/if}

		<div class="grid gap-4 sm:grid-cols-2">
			<Input label="Name" name="name" bind:value={name} required autocomplete="off" />
			<Input label="Name (Bangla)" name="nameBn" bind:value={nameBn} autocomplete="off" />
		</div>

		<Input
			label="Slug"
			name="slug"
			value={autoSlug}
			oninput={(e) => {
				slugTouched = true;
				slug = e.currentTarget.value;
			}}
			hint="Used in the URL. Leave it to follow the name."
		/>

		<Select label="Parent category" name="parentId" bind:value={parentId} options={parentOptions} />

		<MediaPicker label="Image" name="image" bind:value={image} />

		<Checkbox
			name="visible"
			bind:checked={visible}
			label="Visible on the storefront"
			hint="Hidden categories keep their products but disappear from menus."
		/>
	</form>

	{#snippet footer()}
		<Button variant="secondary" onclick={() => (open = false)}>Cancel</Button>
		<Button type="submit" form="category-form"
			>{editing ? 'Save changes' : 'Create category'}</Button
		>
	{/snippet}
</Dialog>
