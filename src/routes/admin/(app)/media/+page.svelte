<script lang="ts">
	import { enhance } from '$app/forms';
	import { fade } from 'svelte/transition';
	import { Trash2, Copy, Check } from '@lucide/svelte';
	import { fadeIn } from '$lib/motion';
	import Button from '$lib/ui/Button.svelte';
	import UploadDropzone from '$lib/ui/UploadDropzone.svelte';

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
</script>

<svelte:head><title>Media · Admin</title></svelte:head>

<h1 class="text-2xl font-semibold tracking-tight text-ink">Media</h1>
<p class="mt-1 text-sm text-ink-muted">Every image used by products, categories and page blocks.</p>

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

<div class="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
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
