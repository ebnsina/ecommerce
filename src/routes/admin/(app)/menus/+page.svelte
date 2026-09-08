<script lang="ts">
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import { fade } from 'svelte/transition';
	import { Check, Menu as MenuIcon, PanelBottom, Info } from '@lucide/svelte';
	import { fadeIn } from '$lib/motion';
	import Button from '$lib/ui/Button.svelte';
	import MenuEditor from '$lib/admin/MenuEditor.svelte';
	import PageHeader from '$lib/admin/PageHeader.svelte';
	import TourButton from '$lib/admin/TourButton.svelte';
	import type { Tour } from '$lib/admin/tour';

	let { data, form } = $props();

	let header = $state(structuredClone(untrack(() => data.header)));
	let footer = $state(structuredClone(untrack(() => data.footer)));

	const tour: Tour = {
		key: 'menus',
		steps: [
			{
				element: '[data-tour="header-menu"]',
				popover: {
					title: 'The bar across the top',
					description:
						'Leave this empty and the shop lists your visible categories by itself. Add items only when you want something different — a landing page, a custom link, another order.'
				}
			},
			{
				element: '[data-tour="footer-menu"]',
				popover: {
					title: 'The footer columns',
					description:
						'Each top-level item becomes one column heading, and the items under it become that column’s links. This is where your delivery, returns and contact pages belong.'
				}
			},
			{
				element: '[data-tour="save-header"]',
				popover: {
					title: 'Each menu saves on its own',
					description: 'Save the one you changed. The shop picks it up immediately — no rebuild.'
				}
			}
		]
	};
</script>

<svelte:head><title>Menus · Admin</title></svelte:head>

<PageHeader title="Menus" description="What shoppers see in the header bar and the footer columns.">
	{#snippet actions()}
		<TourButton {tour} />
	{/snippet}
</PageHeader>

<div class="mt-6 flex flex-col gap-4">
	<form
		method="POST"
		action="?/save"
		use:enhance
		class="rounded-3xl border border-border bg-surface p-5"
		data-tour="header-menu"
	>
		<input type="hidden" name="key" value="header" />
		<input type="hidden" name="tree" value={JSON.stringify(header)} />

		<div class="mb-2 flex items-center justify-between gap-3">
			<h2 class="flex items-center gap-2 text-sm font-medium text-ink">
				<MenuIcon size={16} class="text-primary" />
				Header menu
			</h2>
			{#if form?.saved === 'header'}
				<span class="flex items-center gap-1.5 text-xs text-success" transition:fade={fadeIn()}>
					<Check size={14} />
					Saved
				</span>
			{/if}
		</div>

		<p class="mb-4 flex items-start gap-2 text-xs text-ink-muted">
			<Info size={14} class="mt-0.5 shrink-0" />
			Leave this empty and the header falls back to your visible categories automatically. Add items here
			only when you want something else — a custom link, a landing page, a different order.
		</p>

		<MenuEditor bind:nodes={header} targets={data.targets} childLabel="Sub-item" />
		<Button size="sm" type="submit" class="mt-4" data-tour="save-header">Save header menu</Button>
	</form>

	<form
		method="POST"
		action="?/save"
		use:enhance
		class="rounded-3xl border border-border bg-surface p-5"
		data-tour="footer-menu"
	>
		<input type="hidden" name="key" value="footer" />
		<input type="hidden" name="tree" value={JSON.stringify(footer)} />

		<div class="mb-2 flex items-center justify-between gap-3">
			<h2 class="flex items-center gap-2 text-sm font-medium text-ink">
				<PanelBottom size={16} class="text-primary" />
				Footer columns
			</h2>
			{#if form?.saved === 'footer'}
				<span class="flex items-center gap-1.5 text-xs text-success" transition:fade={fadeIn()}>
					<Check size={14} />
					Saved
				</span>
			{/if}
		</div>

		<p class="mb-4 flex items-start gap-2 text-xs text-ink-muted">
			<Info size={14} class="mt-0.5 shrink-0" />
			Each top-level item is a column heading; its sub-items are the links underneath.
		</p>

		<MenuEditor bind:nodes={footer} targets={data.targets} childLabel="Link" />
		<Button size="sm" type="submit" class="mt-4">Save footer menu</Button>
	</form>
</div>
