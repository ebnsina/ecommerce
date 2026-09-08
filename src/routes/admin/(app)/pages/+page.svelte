<script lang="ts">
	import { enhance } from '$app/forms';
	import { Plus, FileText, Trash2, Home } from '@lucide/svelte';
	import Button from '$lib/ui/Button.svelte';
	import Input from '$lib/ui/Input.svelte';
	import Dialog from '$lib/ui/Dialog.svelte';
	import PageHeader from '$lib/admin/PageHeader.svelte';
	import TourButton from '$lib/admin/TourButton.svelte';
	import type { Tour } from '$lib/admin/tour';

	let { data, form } = $props();
	let open = $state(false);

	const tour: Tour = {
		key: 'pages-list',
		steps: [
			{
				element: '[data-tour="pages-list"]',
				popover: {
					title: 'Your shop’s pages',
					description:
						'The homepage is here, along with any landing page you build. Click one to change what it says. The count beside each is how many sections it is made of.'
				}
			},
			{
				element: '[data-tour="new-page"]',
				popover: {
					title: 'Make a new page',
					description:
						'Give it a title — an Eid sale, a brand page — and it gets its own web address you can share or link from a menu.'
				}
			}
		]
	};
</script>

<svelte:head><title>Pages · Admin</title></svelte:head>

<PageHeader
	title="Pages"
	count={data.list.length}
	description="The homepage and any landing pages, built from sections."
>
	{#snippet actions()}
		<TourButton {tour} />
		<Button size="sm" onclick={() => (open = true)} data-tour="new-page">
			<Plus size={15} />
			New page
		</Button>
	{/snippet}
</PageHeader>

{#if form?.error}
	<p
		class="mt-4 rounded-2xl border border-sale/30 bg-sale/8 px-4 py-3 text-sm text-sale"
		role="alert"
	>
		{form.error}
	</p>
{/if}

<div
	class="mt-6 overflow-hidden rounded-3xl border border-border bg-surface"
	data-tour="pages-list"
>
	{#each data.list as p (p.id)}
		<div class="flex items-center gap-3 border-b border-border px-4 py-3 last:border-0">
			<span
				class="grid size-9 shrink-0 place-items-center rounded-xl bg-surface-alt text-ink-faint"
			>
				{#if p.slug === 'home'}<Home size={16} />{:else}<FileText size={16} />{/if}
			</span>
			<a href="/admin/pages/{p.id}" class="min-w-0 flex-1">
				<span class="block truncate text-sm font-medium text-ink">{p.title}</span>
				<span class="block truncate text-xs text-ink-faint">
					/{p.slug === 'home' ? '' : p.slug} · <span class="num">{p.blocks.length}</span> sections
				</span>
			</a>

			{#if p.draftBlocks}
				<span class="shrink-0 rounded-lg bg-star/15 px-2 py-0.5 text-xs text-ink">Draft</span>
			{/if}
			<span
				class="shrink-0 rounded-lg px-2 py-0.5 text-xs {p.published
					? 'bg-success/10 text-success'
					: 'bg-surface-alt text-ink-muted'}"
			>
				{p.published ? 'Live' : 'Hidden'}
			</span>

			{#if p.slug !== 'home'}
				<form method="POST" action="?/remove" use:enhance>
					<input type="hidden" name="id" value={p.id} />
					<button
						class="grid size-8 place-items-center rounded-lg text-ink-faint transition-colors hover:bg-sale/8 hover:text-sale"
						aria-label="Delete {p.title}"
					>
						<Trash2 size={15} />
					</button>
				</form>
			{/if}
		</div>
	{/each}
</div>

<Dialog bind:open title="New page">
	<form id="page-form" method="POST" action="?/create" use:enhance class="flex flex-col gap-4">
		<Input label="Title" name="title" required placeholder="Eid Sale" />
		<Input
			label="Slug"
			name="slug"
			placeholder="eid-sale"
			hint="Leave empty to follow the title."
		/>
	</form>
	{#snippet footer()}
		<Button variant="secondary" onclick={() => (open = false)}>Cancel</Button>
		<Button type="submit" form="page-form">Create page</Button>
	{/snippet}
</Dialog>
