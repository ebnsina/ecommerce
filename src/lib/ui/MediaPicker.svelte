<script lang="ts">
	import { ImagePlus, X, Check } from '@lucide/svelte';
	import Dialog from '$lib/ui/Dialog.svelte';
	import Button from '$lib/ui/Button.svelte';
	import UploadDropzone from '$lib/ui/UploadDropzone.svelte';

	type Item = { id: string; url: string; alt: string | null };

	let {
		value = $bindable<string | string[]>(''),
		multiple = false,
		label,
		name
	}: { value?: string | string[]; multiple?: boolean; label?: string; name?: string } = $props();

	let open = $state(false);
	let items = $state<Item[]>([]);
	let loading = $state(false);
	let uploading = $state(false);

	const urls = $derived(Array.isArray(value) ? value : value ? [value] : []);

	async function load() {
		loading = true;
		items = await fetch('/admin/media/list').then((r) => r.json());
		loading = false;
	}

	function show() {
		open = true;
		load();
	}

	function toggle(url: string) {
		if (!multiple) {
			value = url;
			open = false;
			return;
		}
		const list = urls.includes(url) ? urls.filter((u) => u !== url) : [...urls, url];
		value = list;
	}

	function removeAt(url: string) {
		value = multiple ? urls.filter((u) => u !== url) : '';
	}

	/** Upload straight from the picker — no trip to the media page. */
	async function upload(files: FileList) {
		uploading = true;
		const body = new FormData();
		for (const f of files) body.append('files', f);
		await fetch('/admin/media?/upload', { method: 'POST', body });
		await load();
		uploading = false;
	}
</script>

{#if label}<span class="mb-1.5 block text-sm font-medium text-ink">{label}</span>{/if}

{#if name}
	<input type="hidden" {name} value={Array.isArray(value) ? value.join(',') : value} />
{/if}

<div class="flex flex-wrap gap-2">
	{#each urls as url (url)}
		<div class="relative size-20 overflow-hidden rounded-2xl border border-border">
			<img src={url} alt="" class="size-full object-cover" />
			<button
				type="button"
				aria-label="Remove image"
				class="absolute top-1 right-1 grid size-6 place-items-center rounded-lg bg-ink/60 text-white"
				onclick={() => removeAt(url)}
			>
				<X size={13} />
			</button>
		</div>
	{/each}

	{#if multiple || urls.length === 0}
		<button
			type="button"
			class="grid size-20 place-items-center rounded-2xl border border-dashed
			       border-border text-ink-faint transition-colors duration-[180ms] ease-brand hover:border-brand-300 hover:text-primary"
			onclick={show}
			aria-label="Choose image"
		>
			<ImagePlus size={18} />
		</button>
	{/if}
</div>

<Dialog
	bind:open
	title="Media"
	description="Pick an existing image or upload a new one."
	width="lg"
>
	<UploadDropzone onfiles={upload} />

	{#if uploading}<p class="mt-3 text-sm text-ink-muted">Uploading…</p>{/if}

	<div class="mt-5 grid max-h-80 grid-cols-3 gap-3 overflow-y-auto sm:grid-cols-4">
		{#each items as m (m.id)}
			{@const on = urls.includes(m.url)}
			<button
				type="button"
				class="relative aspect-square overflow-hidden rounded-2xl border border-border transition-colors duration-[180ms] ease-brand
				       {on ? 'border-primary' : 'hover:border-brand-300'}"
				onclick={() => toggle(m.url)}
			>
				<img src={m.url} alt={m.alt ?? ''} class="size-full object-cover" loading="lazy" />
				{#if on}
					<span
						class="absolute top-1.5 right-1.5 grid size-5 place-items-center rounded-md bg-primary text-white"
					>
						<Check size={13} />
					</span>
				{/if}
			</button>
		{:else}
			<p class="col-span-full py-10 text-center text-sm text-ink-faint">
				{loading ? 'Loading…' : 'No images yet — upload one above.'}
			</p>
		{/each}
	</div>

	{#snippet footer()}
		<Button variant="secondary" onclick={() => (open = false)}>Done</Button>
	{/snippet}
</Dialog>
