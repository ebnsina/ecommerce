<script lang="ts">
	import { LAYOUTS, type LayoutKey } from '$lib/layouts';
	import { LayoutGrid, Check } from '@lucide/svelte';
	import { fly } from 'svelte/transition';
	import { flyUp } from '$lib/motion';

	let { current }: { current: LayoutKey } = $props();

	let open = $state(false);
</script>

<!-- The demo wears five shapes; this is how a visitor tries them on. Plain
     links, so each one is a URL that can be sent to somebody, and the choice
     sticks in a cookie on the way through. -->
<div class="fixed bottom-4 left-4 z-40">
	{#if open}
		<div class="mb-2 w-72 rounded-2xl border border-border bg-surface p-2" transition:fly={flyUp()}>
			<p class="px-2 pt-1 pb-2 text-xs font-semibold tracking-wide text-ink-muted uppercase">
				Shop layout
			</p>
			{#each Object.values(LAYOUTS) as l (l.key)}
				<a
					href="?layout={l.key}"
					data-sveltekit-reload
					class="flex items-start gap-2 rounded-xl px-2 py-2 transition-colors duration-[180ms] ease-brand hover:bg-surface-alt motion-reduce:transition-none"
					aria-current={l.key === current ? 'true' : undefined}
				>
					<span class="grid size-5 shrink-0 place-items-center text-primary">
						{#if l.key === current}<Check size={15} aria-label="Current" />{/if}
					</span>
					<span class="min-w-0">
						<span class="block text-sm font-medium text-ink">{l.label}</span>
						<span class="block text-xs leading-snug text-ink-muted">{l.note}</span>
					</span>
				</a>
			{/each}
		</div>
	{/if}

	<button
		class="flex h-11 items-center gap-2 rounded-2xl border border-border bg-surface px-3.5 text-sm font-medium text-ink transition-colors duration-[180ms] ease-brand hover:border-primary motion-reduce:transition-none"
		aria-expanded={open}
		onclick={() => (open = !open)}
	>
		<LayoutGrid size={17} aria-hidden="true" />
		{LAYOUTS[current].label}
	</button>
</div>
