<script lang="ts">
	import { slide } from 'svelte/transition';
	import { Plus, Trash2, ChevronUp, ChevronDown, Link2 } from '@lucide/svelte';
	import { slideOpen } from '$lib/motion';
	import Input from '$lib/ui/Input.svelte';
	import Select from '$lib/ui/Select.svelte';

	type Node = { label: string; labelBn?: string; href: string; children?: Node[] };
	type Group = { group: string; items: { label: string; href: string }[] };

	/**
	 * Two-level menu editor. `nodes` is bound through, so the parent just
	 * serialises it — no separate save format.
	 */
	let {
		nodes = $bindable(),
		targets,
		childLabel = 'Sub-item'
	}: { nodes: Node[]; targets: Group[]; childLabel?: string } = $props();

	/** Flattened link picker; "custom" leaves the field free for any URL. */
	const options = $derived([
		{ value: '', label: 'Custom URL…' },
		...targets.flatMap((g) =>
			g.items.map((i) => ({ value: i.href, label: `${g.group}: ${i.label}` }))
		)
	]);

	const blank = (): Node => ({ label: '', href: '', children: [] });

	function move(list: Node[], i: number, dir: -1 | 1) {
		const j = i + dir;
		if (j < 0 || j >= list.length) return list;
		const copy = [...list];
		[copy[i], copy[j]] = [copy[j], copy[i]];
		return copy;
	}
</script>

{#snippet row(node: Node, remove: () => void, up: () => void, down: () => void, nested: boolean)}
	<div class="rounded-2xl border border-border p-3 {nested ? 'bg-surface-alt' : ''}">
		<div class="flex flex-wrap items-end gap-3">
			<Input label="Label" bind:value={node.label} class="min-w-40 flex-1" />
			<Input label="Label (Bangla)" bind:value={node.labelBn} class="min-w-40 flex-1" />
			<span class="flex shrink-0 gap-0.5 pb-1">
				<button
					type="button"
					class="grid size-8 place-items-center rounded-lg text-ink-faint hover:text-ink"
					aria-label="Move up"
					onclick={up}
				>
					<ChevronUp size={15} />
				</button>
				<button
					type="button"
					class="grid size-8 place-items-center rounded-lg text-ink-faint hover:text-ink"
					aria-label="Move down"
					onclick={down}
				>
					<ChevronDown size={15} />
				</button>
				<button
					type="button"
					class="grid size-8 place-items-center rounded-lg text-ink-faint hover:text-sale"
					aria-label="Remove"
					onclick={remove}
				>
					<Trash2 size={15} />
				</button>
			</span>
		</div>

		<div class="mt-3 grid gap-3 sm:grid-cols-2">
			<Select
				label="Links to"
				value={options.some((o) => o.value === node.href) ? node.href : ''}
				{options}
				onchange={(v) => (node.href = v)}
			/>
			<Input label="URL" bind:value={node.href} placeholder="/c/electronics" />
		</div>
	</div>
{/snippet}

<div class="flex flex-col gap-3">
	{#each nodes as node, i (i)}
		<div transition:slide={slideOpen()}>
			{@render row(
				node,
				() => (nodes = nodes.filter((_, j) => j !== i)),
				() => (nodes = move(nodes, i, -1)),
				() => (nodes = move(nodes, i, 1)),
				false
			)}

			<div class="mt-2 ml-6 flex flex-col gap-2">
				{#each node.children ?? [] as child, ci (ci)}
					{@render row(
						child,
						() => (node.children = (node.children ?? []).filter((_, j) => j !== ci)),
						() => (node.children = move(node.children ?? [], ci, -1)),
						() => (node.children = move(node.children ?? [], ci, 1)),
						true
					)}
				{/each}

				<button
					type="button"
					class="flex items-center gap-1.5 self-start text-xs text-ink-muted transition-colors hover:text-primary"
					onclick={() => (node.children = [...(node.children ?? []), blank()])}
				>
					<Plus size={13} />
					Add {childLabel.toLowerCase()}
				</button>
			</div>
		</div>
	{:else}
		<p
			class="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-ink-faint"
		>
			<Link2 size={18} class="mx-auto mb-2" />
			Nothing here yet.
		</p>
	{/each}

	<button
		type="button"
		class="flex items-center justify-center gap-2 rounded-2xl border
		       border-dashed border-border py-4 text-sm text-ink-muted transition-colors duration-[180ms] ease-brand hover:border-brand-300 hover:text-primary"
		onclick={() => (nodes = [...nodes, blank()])}
	>
		<Plus size={15} />
		Add item
	</button>
</div>
