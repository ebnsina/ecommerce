<script lang="ts">
	import type { Snippet } from 'svelte';
	import { EllipsisVertical } from '@lucide/svelte';
	import Dropdown from '$lib/ui/Dropdown.svelte';

	/** The per-row menu. Anchored, so a row near the bottom opens upward. */
	let { menu, label = 'Row actions' }: { menu: Snippet<[{ close: () => void }]>; label?: string } =
		$props();
</script>

<Dropdown align="end" class="w-fit">
	{#snippet trigger()}
		<span
			class="grid size-9 place-items-center rounded-xl border border-border text-ink-faint
			       transition-colors duration-[180ms] ease-brand hover:text-ink"
			aria-label={label}
		>
			<EllipsisVertical size={16} />
		</span>
	{/snippet}
	{#snippet children({ close })}
		{@render menu({ close })}
	{/snippet}
</Dropdown>
