<script lang="ts">
	import type { Block } from '$lib/server/db/schema';
	import type { BlockItem } from '$lib/blocks/schema';
	import TourButton from '$lib/admin/TourButton.svelte';
	import type { Tour } from '$lib/admin/tour';
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import { slide } from 'svelte/transition';
	import {
		ArrowLeft,
		Plus,
		Trash2,
		Copy,
		ChevronUp,
		ChevronDown,
		ChevronRight,
		Eye,
		LayoutTemplate
	} from '@lucide/svelte';
	import { blockDefs, blockDef } from '$lib/blocks/schema';
	import { slideOpen } from '$lib/motion';
	import Button from '$lib/ui/Button.svelte';
	import Input from '$lib/ui/Input.svelte';
	import Textarea from '$lib/ui/Textarea.svelte';
	import Checkbox from '$lib/ui/Checkbox.svelte';
	import Dialog from '$lib/ui/Dialog.svelte';
	import FieldInput from '$lib/admin/FieldInput.svelte';
	import { SHOP, shop } from '$lib/paths';

	let { data, form } = $props();
	const init = untrack(() => data);

	/* The draft wins if one exists — that is what "unpublished changes" means. */
	let blocks = $state<Block[]>(structuredClone(init.page.draftBlocks ?? init.page.blocks ?? []));
	let title = $state(init.page.title);
	let slug = $state(init.page.slug);
	let seoTitle = $state(init.page.seoTitle ?? '');
	let seoDescription = $state(init.page.seoDescription ?? '');
	let published = $state(init.page.published);

	let openBlock = $state<string | null>(untrack(() => blocks[0]?.id) ?? null);
	let addOpen = $state(false);

	const payload = $derived(JSON.stringify(blocks));
	const isHome = $derived(data.page.slug === 'home');
	const hasDraft = $derived(!!data.page.draftBlocks);

	function add(type: string) {
		const def = blockDef(type);
		if (!def) return;
		const block = { id: crypto.randomUUID(), type, props: structuredClone(def.defaults) };
		blocks = [...blocks, block];
		openBlock = block.id;
		addOpen = false;
	}

	function move(i: number, dir: -1 | 1) {
		const j = i + dir;
		if (j < 0 || j >= blocks.length) return;
		const list = [...blocks];
		[list[i], list[j]] = [list[j], list[i]];
		blocks = list;
	}

	function duplicate(i: number) {
		const copy = { ...structuredClone($state.snapshot(blocks[i])), id: crypto.randomUUID() };
		blocks = [...blocks.slice(0, i + 1), copy, ...blocks.slice(i + 1)];
	}

	/** A short line so the collapsed card says what the block actually holds. */
	function summary(block: Block) {
		const p = block.props;
		if (p.heading) return p.heading;
		if (p.text) return p.text;
		if (Array.isArray(p.slides))
			return `${p.slides.filter((s: BlockItem) => s.image).length} slide(s)`;
		if (Array.isArray(p.banners))
			return `${p.banners.filter((b: BlockItem) => b.image).length} banner(s)`;
		if (Array.isArray(p.items)) return `${p.items.length} item(s)`;
		return blockDef(block.type)?.description ?? '';
	}

	/* Building a page from blocks is the least self-explanatory screen in here,
	   so it explains itself the first time someone opens it. */
	const tour: Tour = {
		key: 'page-editor',
		steps: [
			{
				element: '[data-tour="sections"]',
				popover: {
					title: 'A page is a stack of sections',
					description:
						'Each box here is one band of the page, in the order shoppers see it. Click one to open it and change its wording, pictures or products. The arrows on the right move a section up or down.'
				}
			},
			{
				element: '[data-tour="add-section"]',
				popover: {
					title: 'Add a section',
					description:
						'Pick from banners, product rows, category tiles and the rest. A new section lands at the bottom — move it where you want it.'
				}
			},
			{
				element: '[data-tour="page-settings"]',
				popover: {
					title: 'The page itself',
					description:
						'The title, the web address, and what Google shows for this page. The homepage keeps its address.'
				}
			},
			{
				element: '[data-tour="save-draft"]',
				popover: {
					title: 'Save without showing anyone',
					description:
						'A draft is yours alone. Use Preview to see it as a shopper would, before anybody else can.'
				}
			},
			{
				element: '[data-tour="publish"]',
				popover: {
					title: 'Publish when you are happy',
					description:
						'This is the moment the change goes live on the shop. Nothing before it does.'
				}
			}
		]
	};
</script>

<svelte:head><title>{title} · Pages · Admin</title></svelte:head>

<a
	href="/admin/pages"
	class="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
>
	<ArrowLeft size={15} />
	All pages
</a>

<form method="POST" action="?/publish" use:enhance class="mt-3">
	<input type="hidden" name="blocks" value={payload} />

	<div class="flex flex-wrap items-start justify-between gap-4">
		<div class="min-w-0">
			<h1 class="truncate text-2xl font-semibold tracking-tight text-ink">{title}</h1>
			<p class="mt-1 text-sm text-ink-faint">
				/{isHome ? '' : data.page.slug}
				{#if hasDraft}
					<span class="ml-2 rounded-lg bg-star/15 px-2 py-0.5 text-xs text-ink"
						>Unpublished changes</span
					>
				{/if}
			</p>
		</div>
		<div class="flex flex-wrap gap-2">
			<Button
				variant="ghost"
				href={isHome ? `${SHOP}?preview=1` : shop(`/pages/${data.page.slug}?preview=1`)}
				target="_blank"
			>
				<Eye size={16} />
				Preview
			</Button>
			<Button variant="secondary" formaction="?/saveDraft" data-tour="save-draft">Save draft</Button
			>
			<Button type="submit" data-tour="publish">Publish</Button>
			<TourButton {tour} />
		</div>
	</div>

	{#if form?.error}
		<p
			class="mt-4 rounded-2xl border border-sale/30 bg-sale/8 px-4 py-3 text-sm text-sale"
			role="alert"
		>
			{form.error}
		</p>
	{:else if form?.saved}
		<p
			class="mt-4 rounded-2xl border border-success/30 bg-success/8 px-4 py-3 text-sm text-success"
		>
			{form.saved === 'published' ? 'Published — shoppers see this now.' : 'Draft saved.'}
		</p>
	{/if}

	<div class="mt-6 grid gap-4 lg:grid-cols-[1fr_20rem]">
		<!-- block list -->
		<div class="flex flex-col gap-3" data-tour="sections">
			{#each blocks as block, i (block.id)}
				{@const def = blockDef(block.type)}
				<section class="rounded-3xl border border-border bg-surface" transition:slide={slideOpen()}>
					<div class="flex items-center gap-3 p-4">
						<button
							type="button"
							class="flex min-w-0 flex-1 items-center gap-3 text-left"
							onclick={() => (openBlock = openBlock === block.id ? null : block.id)}
							aria-expanded={openBlock === block.id}
						>
							<ChevronRight
								size={16}
								class="shrink-0 text-ink-faint transition-transform duration-[180ms] ease-brand {openBlock ===
								block.id
									? 'rotate-90'
									: ''}"
							/>
							<span class="min-w-0">
								<span class="block text-sm font-medium text-ink">{def?.name ?? block.type}</span>
								<span class="block truncate text-xs text-ink-muted">{summary(block)}</span>
							</span>
						</button>

						<span class="flex shrink-0 items-center gap-0.5">
							<button
								type="button"
								class="grid size-8 place-items-center rounded-lg text-ink-faint transition-colors hover:bg-surface-alt hover:text-ink"
								aria-label="Move up"
								onclick={() => move(i, -1)}
							>
								<ChevronUp size={15} />
							</button>
							<button
								type="button"
								class="grid size-8 place-items-center rounded-lg text-ink-faint transition-colors hover:bg-surface-alt hover:text-ink"
								aria-label="Move down"
								onclick={() => move(i, 1)}
							>
								<ChevronDown size={15} />
							</button>
							<button
								type="button"
								class="grid size-8 place-items-center rounded-lg text-ink-faint transition-colors hover:bg-surface-alt hover:text-ink"
								aria-label="Duplicate"
								onclick={() => duplicate(i)}
							>
								<Copy size={15} />
							</button>
							<button
								type="button"
								class="grid size-8 place-items-center rounded-lg text-ink-faint transition-colors hover:bg-sale/8 hover:text-sale"
								aria-label="Delete block"
								onclick={() => (blocks = blocks.filter((b) => b.id !== block.id))}
							>
								<Trash2 size={15} />
							</button>
						</span>
					</div>

					{#if openBlock === block.id && def}
						<div
							class="flex flex-col gap-4 border-t border-border p-4"
							transition:slide={slideOpen()}
						>
							{#each def.fields as field (field.key)}
								<FieldInput
									{field}
									bind:value={block.props[field.key]}
									categories={data.categories}
									catalog={data.catalog}
								/>
							{/each}
						</div>
					{/if}
				</section>
			{/each}

			<button
				type="button"
				class="flex items-center justify-center gap-2 rounded-3xl border
				       border-dashed border-border py-6 text-sm text-ink-muted transition-colors duration-[180ms] ease-brand hover:border-brand-300 hover:text-primary"
				onclick={() => (addOpen = true)}
				data-tour="add-section"
			>
				<Plus size={16} />
				Add a section
			</button>
		</div>

		<!-- page settings -->
		<div class="flex flex-col gap-4" data-tour="page-settings">
			<section class="rounded-3xl border border-border bg-surface p-5">
				<h2 class="mb-4 text-sm font-medium text-ink">Page</h2>
				<div class="flex flex-col gap-4">
					<Input label="Title" name="title" bind:value={title} required />
					{#if !isHome}
						<Input label="Slug" name="slug" bind:value={slug} hint="The page URL." />
					{/if}
					<Checkbox
						name="published"
						bind:checked={published}
						label="Published"
						hint="Unpublished pages are only visible to staff."
					/>
				</div>
			</section>

			<section class="rounded-3xl border border-border bg-surface p-5">
				<h2 class="mb-4 text-sm font-medium text-ink">Search engine listing</h2>
				<div class="flex flex-col gap-4">
					<Input label="SEO title" name="seoTitle" bind:value={seoTitle} placeholder={title} />
					<Textarea
						label="SEO description"
						name="seoDescription"
						bind:value={seoDescription}
						rows={3}
					/>
				</div>
			</section>
		</div>
	</div>
</form>

<Dialog
	bind:open={addOpen}
	title="Add a section"
	description="Pick what to put on the page."
	width="lg"
>
	<div class="grid gap-2 sm:grid-cols-2">
		{#each blockDefs as def (def.type)}
			<button
				type="button"
				class="rounded-2xl border border-border p-4 text-left transition-colors duration-[180ms] ease-brand hover:border-brand-300 hover:bg-surface-alt"
				onclick={() => add(def.type)}
			>
				<span class="flex items-center gap-2 text-sm font-medium text-ink">
					<LayoutTemplate size={15} class="text-primary" />
					{def.name}
				</span>
				<span class="mt-1 block text-xs text-ink-muted">{def.description}</span>
			</button>
		{/each}
	</div>
</Dialog>
