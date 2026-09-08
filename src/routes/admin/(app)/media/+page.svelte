<script lang="ts">
	import { enhance } from '$app/forms';
	import { fade } from 'svelte/transition';
	import { Trash2, Copy, Check } from '@lucide/svelte';
	import { fadeIn } from '$lib/motion';
	import Button from '$lib/ui/Button.svelte';
	import UploadDropzone from '$lib/ui/UploadDropzone.svelte';
	import PageHeader from '$lib/admin/PageHeader.svelte';
	import { Search, ChevronLeft, ChevronRight } from '@lucide/svelte';
	import { debouncedSetParams, setParams } from '$lib/admin/listQuery';

	let { data, form } = $props();

	let uploading = $state(false);
	let picked = $state(0);
	let copied = $state<string | null>(null);

	async function copy(url: string) {
		await navigator.clipboard.writeText(new URL(url, location.origin).href);
		copied = url;
		setTimeout(() => (copied = null), 1500);
	}

	const kb = (n: number | null) => (n ? `${Math.round(n / 1024)} KB` : '');

	const from = $derived(data.total === 0 ? 0 : (data.page - 1) * data.perPage + 1);
	const to = $derived(Math.min(data.page * data.perPage, data.total));
	const lastPage = $derived(Math.max(1, Math.ceil(data.total / data.perPage)));
</script>

<svelte:head><title>Media · Admin</title></svelte:head>

<PageHeader
	title="Media"
	count={data.total}
	description="Every image used by products, categories and page blocks."
/>

<form
	method="POST"
	action="?/upload"
	enctype="multipart/form-data"
	class="mt-6"
	use:enhance={() => {
		uploading = true;
		return async ({ update }) => {
			uploading = false;
			picked = 0;
			await update();
		};
	}}
>
	<UploadDropzone onfiles={(f) => (picked = f.length)} />
	{#if picked > 0}
		<div class="mt-3 flex items-center gap-3" transition:fade={fadeIn()}>
			<p class="text-sm text-ink-muted">
				<span class="num font-medium">{picked}</span>
				{picked === 1 ? 'image' : 'images'} ready
			</p>
			<Button size="sm" type="submit" loading={uploading}>Upload</Button>
		</div>
	{/if}
</form>

{#if form?.error}
	<p
		class="mt-4 rounded-2xl border border-sale/30 bg-sale/8 px-4 py-3 text-sm text-sale"
		role="alert"
	>
		{form.error}
	</p>
{/if}

<!-- Search sits above the gallery, the same place it does above a table. -->
<div class="relative mt-6 max-w-80">
	<Search
		size={16}
		class="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-faint"
	/>
	<input
		type="search"
		value={data.filters.q}
		placeholder="Image name or description"
		aria-label="Search images"
		class="h-11 w-full rounded-xl border border-border bg-surface pr-3.5 pl-10 text-sm text-ink
		       transition-colors duration-[180ms] ease-brand placeholder:text-ink-faint"
		oninput={(e) => debouncedSetParams({ q: e.currentTarget.value })}
	/>
</div>

<div class="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
	{#each data.items as m (m.id)}
		<figure
			class="overflow-hidden rounded-3xl border border-border bg-surface"
			transition:fade={fadeIn()}
		>
			<div class="aspect-square bg-surface-alt">
				<img src={m.url} alt={m.alt ?? ''} class="size-full object-cover" loading="lazy" />
			</div>
			<figcaption class="flex items-center gap-1 px-3 py-2">
				<span class="min-w-0 flex-1">
					<span class="block truncate text-xs text-ink">{m.alt || 'Untitled'}</span>
					<span class="num block text-[11px] text-ink-faint">{kb(m.sizeBytes)}</span>
				</span>
				<button
					class="grid size-8 place-items-center rounded-lg text-ink-faint transition-colors hover:bg-surface-alt hover:text-ink"
					aria-label="Copy URL"
					onclick={() => copy(m.url)}
				>
					{#if copied === m.url}<Check size={15} class="text-success" />{:else}<Copy
							size={15}
						/>{/if}
				</button>
				<form method="POST" action="?/remove" use:enhance>
					<input type="hidden" name="id" value={m.id} />
					<button
						class="grid size-8 place-items-center rounded-lg text-ink-faint transition-colors hover:bg-sale/8 hover:text-sale"
						aria-label="Delete image"
					>
						<Trash2 size={15} />
					</button>
				</form>
			</figcaption>
		</figure>
	{:else}
		<p class="col-span-full py-16 text-center text-sm text-ink-faint">Nothing uploaded yet.</p>
	{/each}
</div>

{#if data.total > data.perPage}
	<div class="mt-6 flex items-center justify-center gap-2">
		<button
			class="grid size-9 place-items-center rounded-xl border border-border text-ink-muted
			       transition-colors duration-[180ms] ease-brand hover:text-ink
			       disabled:cursor-not-allowed disabled:text-ink-faint"
			aria-label="Previous page"
			disabled={data.page <= 1}
			onclick={() => setParams({ page: data.page - 1 })}
		>
			<ChevronLeft size={16} />
		</button>
		<p class="num text-sm text-ink-muted">{from}–{to} of {data.total}</p>
		<button
			class="grid size-9 place-items-center rounded-xl border border-border text-ink-muted
			       transition-colors duration-[180ms] ease-brand hover:text-ink
			       disabled:cursor-not-allowed disabled:text-ink-faint"
			aria-label="Next page"
			disabled={data.page >= lastPage}
			onclick={() => setParams({ page: data.page + 1 })}
		>
			<ChevronRight size={16} />
		</button>
	</div>
{/if}
