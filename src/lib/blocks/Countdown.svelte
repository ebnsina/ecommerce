<script lang="ts">
	import { onMount } from 'svelte';

	let { to }: { to: string } = $props();

	let now = $state(Date.now());
	onMount(() => {
		const t = setInterval(() => (now = Date.now()), 1000);
		return () => clearInterval(t);
	});

	const left = $derived(Math.max(0, new Date(to).getTime() - now));
	const parts = $derived([
		{ label: 'd', value: Math.floor(left / 864e5) },
		{ label: 'h', value: Math.floor(left / 36e5) % 24 },
		{ label: 'm', value: Math.floor(left / 6e4) % 60 },
		{ label: 's', value: Math.floor(left / 1000) % 60 }
	]);
</script>

{#if left > 0}
	<span class="flex items-center gap-1.5" aria-label="Offer ends in">
		{#each parts as p (p.label)}
			<span
				class="num rounded-lg bg-sale/10 px-2 py-1 text-xs font-semibold text-sale tabular-nums"
			>
				{String(p.value).padStart(2, '0')}{p.label}
			</span>
		{/each}
	</span>
{/if}
