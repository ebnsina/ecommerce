<script lang="ts">
	import { CircleHelp } from '@lucide/svelte';
	import { runTour, runTourOnce, type Tour } from './tour';

	/**
	 * "Show me how" for the page it sits on. Runs itself once on a first visit,
	 * and stays here for anyone who wants it again.
	 */
	let { tour, label = 'Show me how' }: { tour: Tour; label?: string } = $props();

	$effect(() => {
		runTourOnce(tour);
	});
</script>

<button
	type="button"
	class="flex h-9 items-center gap-2 rounded-xl border border-border px-3 text-sm font-medium text-ink-muted
	       transition-colors duration-[180ms] ease-brand hover:border-brand-300 hover:text-ink"
	onclick={() => runTour(tour)}
>
	<CircleHelp size={15} />
	{label}
</button>
