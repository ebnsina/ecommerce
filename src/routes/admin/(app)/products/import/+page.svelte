<script lang="ts">
	import { enhance } from '$app/forms';
	import { fade } from 'svelte/transition';
	import {
		ArrowLeft,
		Download,
		Upload,
		Check,
		TriangleAlert,
		FileSpreadsheet
	} from '@lucide/svelte';
	import SiShopify from '@icons-pack/svelte-simple-icons/icons/SiShopify';
	import SiWoocommerce from '@icons-pack/svelte-simple-icons/icons/SiWoocommerce';
	import { fadeIn } from '$lib/motion';
	import Button from '$lib/ui/Button.svelte';
	import Checkbox from '$lib/ui/Checkbox.svelte';
	import UploadDropzone from '$lib/ui/UploadDropzone.svelte';

	let { data, form } = $props();

	/* What the importer detects, stated plainly with each platform's own mark. */
	const formats = [
		{ Icon: SiShopify, color: '#95BF47', name: 'Shopify', file: 'products_export.csv' },
		{ Icon: SiWoocommerce, color: '#7F54B3', name: 'WooCommerce', file: 'wc-product-export.csv' },
		{
			Icon: FileSpreadsheet,
			color: 'var(--color-primary)',
			name: 'This store',
			file: 'from Export below'
		}
	];

	let picked = $state('');
	let running = $state(false);
	let dryRun = $state(true);

	const tone: Record<string, string> = {
		created: 'text-success',
		updated: 'text-primary',
		skipped: 'text-sale'
	};
</script>

<svelte:head><title>Import products · Admin</title></svelte:head>

<a
	href="/admin/products"
	class="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
>
	<ArrowLeft size={15} />
	All products
</a>

<div class="mt-3 max-w-3xl">
	<h1 class="text-2xl font-semibold tracking-tight text-ink">Import products</h1>
	<p class="mt-1 text-sm text-ink-muted">
		Upload a CSV to create or update products in bulk. Rows are matched on
		<span class="font-medium text-ink">slug</span> — an existing slug updates that product, a new one
		creates it.
	</p>

	<div class="mt-5 grid gap-3 sm:grid-cols-3">
		{#each formats as f (f.name)}
			<div class="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3">
				<span class="grid size-9 shrink-0 place-items-center rounded-xl bg-surface-alt">
					<f.Icon size={18} style="color: {f.color}" />
				</span>
				<span class="min-w-0">
					<span class="block text-sm font-medium text-ink">{f.name}</span>
					<span class="block truncate font-mono text-xs text-ink-faint">{f.file}</span>
				</span>
			</div>
		{/each}
	</div>

	<p class="mt-3 text-sm text-ink-muted">
		The format is detected from the header row — export from your old shop and upload it as it
		comes. Shopify rows sharing a handle are folded into one product with its options and images;
		WooCommerce variation rows are skipped and a sale price becomes the live price.
	</p>

	<div class="mt-5 flex flex-wrap items-center gap-3">
		<Button size="sm" variant="secondary" href="/admin/products/export">
			<Download size={15} />
			Download current products
		</Button>
		<details class="text-sm">
			<summary class="cursor-pointer text-ink-muted transition-colors hover:text-ink">
				Which columns are accepted?
			</summary>
			<div class="mt-3 rounded-2xl bg-surface-alt p-4">
				<p class="font-mono text-xs break-words text-ink-muted">{data.columns.join(', ')}</p>
				<p class="mt-2 text-xs text-ink-muted">
					Only the columns present in your file are written, so a file with just
					<span class="font-mono">slug, stock</span> updates stock and leaves everything else alone.
					Prices are in taka. Categories are names separated by
					<span class="font-mono">;</span> and must already exist.
				</p>
			</div>
		</details>
	</div>

	<form
		method="POST"
		action="?/import"
		enctype="multipart/form-data"
		class="mt-4"
		use:enhance={() => {
			running = true;
			return async ({ update }) => {
				running = false;
				await update({ reset: false });
			};
		}}
	>
		<UploadDropzone
			name="file"
			multiple={false}
			accept=".csv,text/csv"
			label="Drop your CSV here or click to choose"
			hint="Exported from Shopify, WooCommerce, or this store"
			onfiles={(f) => (picked = f[0]?.name ?? '')}
		/>

		<div class="mt-4 flex flex-wrap items-center gap-4">
			<Checkbox
				name="dryRun"
				bind:checked={dryRun}
				label="Preview only"
				hint="Shows what would change without writing anything."
			/>
			<Button type="submit" loading={running} disabled={!picked}>
				<Upload size={16} />
				{dryRun ? 'Preview import' : 'Import products'}
			</Button>
			{#if picked}
				<span class="text-sm text-ink-muted">{picked}</span>
			{/if}
		</div>
	</form>

	{#if form?.error}
		<p
			class="mt-4 rounded-2xl border border-sale/30 bg-sale/8 px-4 py-3 text-sm text-sale"
			role="alert"
		>
			{form.error}
		</p>
	{/if}

	{#if form?.results}
		<div class="mt-6" transition:fade={fadeIn()}>
			<div class="flex flex-wrap items-center gap-3">
				<h2 class="text-sm font-medium text-ink">
					{form.dryRun ? 'Preview' : 'Import complete'}
				</h2>
				{#if form.formatLabel}
					<span
						class="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2 py-0.5 text-xs font-medium text-ink"
					>
						<FileSpreadsheet size={12} class="shrink-0 text-primary" />
						{form.formatLabel}
					</span>
				{/if}
				<span class="flex gap-2 text-xs">
					<span class="rounded-lg bg-success/10 px-2 py-0.5 text-success">
						<span class="num font-semibold">{form.created}</span> created
					</span>
					<span class="rounded-lg bg-primary-soft px-2 py-0.5 text-primary">
						<span class="num font-semibold">{form.updated}</span> updated
					</span>
					{#if form.skipped}
						<span class="rounded-lg bg-sale/10 px-2 py-0.5 text-sale">
							<span class="num font-semibold">{form.skipped}</span> skipped
						</span>
					{/if}
				</span>
			</div>

			{#if form.dryRun}
				<p class="mt-2 flex items-center gap-1.5 text-xs text-ink-muted">
					<TriangleAlert size={13} class="text-star" />
					Nothing was written. Untick “Preview only” to apply.
				</p>
			{:else}
				<p class="mt-2 flex items-center gap-1.5 text-xs text-success">
					<Check size={13} />
					Changes are live.
				</p>
			{/if}

			<div class="mt-3 overflow-hidden rounded-2xl border border-border bg-surface">
				<table class="w-full text-sm">
					<thead>
						<tr class="border-b border-border text-left text-xs text-ink-muted">
							<th class="px-4 py-2 font-medium">Line</th>
							<th class="px-4 py-2 font-medium">Product</th>
							<th class="px-4 py-2 font-medium">Result</th>
						</tr>
					</thead>
					<tbody>
						{#each form.results as r (r.line)}
							<tr class="border-b border-border last:border-0">
								<td class="num px-4 py-2 text-ink-muted">{r.line}</td>
								<td class="px-4 py-2 text-ink">{r.title}</td>
								<td class="px-4 py-2">
									<span class="font-medium capitalize {tone[r.action]}">{r.action}</span>
									{#if r.note}<span class="block text-xs text-ink-muted">{r.note}</span>{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}
</div>
