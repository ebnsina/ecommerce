<script lang="ts">
	import { Upload } from '@lucide/svelte';

	let {
		name = 'files',
		multiple = true,
		accept = 'image/*',
		label = 'Drop images here or click to choose',
		hint = 'JPG, PNG, WebP or AVIF · up to 5MB each',
		onfiles
	}: {
		name?: string;
		multiple?: boolean;
		accept?: string;
		label?: string;
		hint?: string;
		onfiles?: (files: FileList) => void;
	} = $props();

	let input = $state<HTMLInputElement | null>(null);
	let dragging = $state(false);

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		dragging = false;
		if (!e.dataTransfer?.files.length || !input) return;
		input.files = e.dataTransfer.files; // keeps the native form submission working
		onfiles?.(e.dataTransfer.files);
	}
</script>

<label
	class="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-3xl border border-dashed
	       px-6 py-10 text-center transition-colors duration-[180ms] ease-brand
	       {dragging ? 'border-primary bg-primary-soft' : 'border-border hover:border-brand-300'}"
	ondragover={(e) => {
		e.preventDefault();
		dragging = true;
	}}
	ondragleave={() => (dragging = false)}
	ondrop={handleDrop}
>
	<input
		bind:this={input}
		type="file"
		{name}
		{multiple}
		{accept}
		class="sr-only"
		onchange={(e) => e.currentTarget.files && onfiles?.(e.currentTarget.files)}
	/>
	<Upload size={20} class="text-ink-faint" />
	<span class="text-sm font-medium text-ink">{label}</span>
	<span class="text-xs text-ink-faint">{hint}</span>
</label>
