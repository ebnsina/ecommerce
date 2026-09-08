<script lang="ts">
	import type { BlockProps } from '$lib/blocks/schema';
	import { Plus, Trash2, ChevronUp, ChevronDown } from '@lucide/svelte';
	import { slide } from 'svelte/transition';
	import { slideOpen } from '$lib/motion';
	import type { Field } from '$lib/blocks/schema';
	import Input from '$lib/ui/Input.svelte';
	import Textarea from '$lib/ui/Textarea.svelte';
	import Select from '$lib/ui/Select.svelte';
	import Checkbox from '$lib/ui/Checkbox.svelte';
	import MediaPicker from '$lib/ui/MediaPicker.svelte';
	import SourceInput from './SourceInput.svelte';
	import RichTextEditor from './RichTextEditor.svelte';
	import Self from './FieldInput.svelte';

	/**
	 * One input per field descriptor. `value` is bound through so the whole
	 * block tree stays a plain object that serialises straight to JSON.
	 */
	let {
		field,
		value = $bindable(),
		categories = [],
		catalog = []
	}: {
		field: Field;
		value: BlockProps[string];
		categories?: { id: string; name: string; parentId: string | null }[];
		catalog?: { id: string; title: string }[];
	} = $props();

	function addItem() {
		const blank = Object.fromEntries(
			(field as Extract<Field, { type: 'repeater' }>).fields.map((f) => [
				f.key,
				f.type === 'boolean' ? false : ''
			])
		);
		value = [...(value ?? []), blank];
	}

	function move(i: number, dir: -1 | 1) {
		const list = [...value];
		const j = i + dir;
		if (j < 0 || j >= list.length) return;
		[list[i], list[j]] = [list[j], list[i]];
		value = list;
	}
</script>

{#if field.type === 'text'}
	<Input label={field.label} bind:value placeholder={field.placeholder} hint={field.hint} />
{:else if field.type === 'link'}
	<Input
		label={field.label}
		bind:value
		placeholder={field.placeholder ?? '/demo/c/slug'}
		hint={field.hint}
	/>
{:else if field.type === 'textarea'}
	<Textarea label={field.label} bind:value hint={field.hint} />
{:else if field.type === 'number'}
	<Input
		label={field.label}
		bind:value
		type="number"
		min={field.min}
		max={field.max}
		numeric
		hint={field.hint}
	/>
{:else if field.type === 'boolean'}
	<Checkbox bind:checked={value} label={field.label} hint={field.hint} />
{:else if field.type === 'select'}
	<Select label={field.label} bind:value options={field.options} hint={field.hint} />
{:else if field.type === 'image'}
	<MediaPicker label={field.label} bind:value />
{:else if field.type === 'images'}
	<MediaPicker label={field.label} bind:value multiple />
{:else if field.type === 'richtext'}
	<RichTextEditor label={field.label} bind:value />
{:else if field.type === 'source'}
	<SourceInput bind:value {categories} {catalog} label={field.label} />
{:else if field.type === 'repeater'}
	<div class="flex flex-col gap-2">
		<div class="flex items-center justify-between">
			<span class="text-sm font-medium text-ink">{field.label}</span>
			{#if !field.max || (value?.length ?? 0) < field.max}
				<button
					type="button"
					class="flex items-center gap-1 text-xs font-medium text-primary"
					onclick={addItem}
				>
					<Plus size={13} />
					Add
				</button>
			{/if}
		</div>

		{#each value ?? [] as item, i (i)}
			<div class="rounded-2xl border border-border p-3" transition:slide={slideOpen()}>
				<div class="mb-2 flex items-center justify-between">
					<span class="text-xs text-ink-faint">
						{item[field.itemKey] || `Item ${i + 1}`}
					</span>
					<span class="flex items-center gap-0.5">
						<button
							type="button"
							class="grid size-7 place-items-center rounded-lg text-ink-faint hover:text-ink"
							aria-label="Move up"
							onclick={() => move(i, -1)}
						>
							<ChevronUp size={14} />
						</button>
						<button
							type="button"
							class="grid size-7 place-items-center rounded-lg text-ink-faint hover:text-ink"
							aria-label="Move down"
							onclick={() => move(i, 1)}
						>
							<ChevronDown size={14} />
						</button>
						<button
							type="button"
							class="grid size-7 place-items-center rounded-lg text-ink-faint hover:text-sale"
							aria-label="Remove"
							onclick={() => (value = value.filter((_: unknown, j: number) => j !== i))}
						>
							<Trash2 size={14} />
						</button>
					</span>
				</div>

				<div class="flex flex-col gap-3">
					{#each field.fields as sub (sub.key)}
						<Self field={sub} bind:value={item[sub.key]} {categories} {catalog} />
					{/each}
				</div>
			</div>
		{/each}

		{#if !(value?.length ?? 0)}
			<p
				class="rounded-2xl border border-dashed border-border px-3 py-6 text-center text-xs text-ink-faint"
			>
				Nothing added yet.
			</p>
		{/if}
	</div>
{/if}
