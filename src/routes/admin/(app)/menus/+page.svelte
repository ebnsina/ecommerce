<script lang="ts">
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import { fade } from 'svelte/transition';
	import { Check, Menu as MenuIcon, PanelBottom, Info } from '@lucide/svelte';
	import { fadeIn } from '$lib/motion';
	import Button from '$lib/ui/Button.svelte';
	import MenuEditor from '$lib/admin/MenuEditor.svelte';

	let { data, form } = $props();

	let header = $state(structuredClone(untrack(() => data.header)));
	let footer = $state(structuredClone(untrack(() => data.footer)));
</script>

<svelte:head><title>Menus · Admin</title></svelte:head>

<h1 class="text-2xl font-semibold tracking-tight text-ink">Menus</h1>
<p class="mt-1 text-sm text-ink-muted">
	What shoppers see in the header bar and the footer columns.
</p>

<div class="mt-6 flex flex-col gap-4">
	<form
		method="POST"
		action="?/save"
		use:enhance
		class="rounded-3xl border border-border bg-surface p-5"
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
		<Button size="sm" type="submit" class="mt-4">Save header menu</Button>
	</form>

	<form
		method="POST"
		action="?/save"
		use:enhance
		class="rounded-3xl border border-border bg-surface p-5"
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
