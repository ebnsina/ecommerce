<script lang="ts">
	import type { BlockProps } from './schema';
	import { X } from '@lucide/svelte';
	import { slide } from 'svelte/transition';
	import { slideOpen } from '$lib/motion';
	import { bg } from './backgrounds';

	let { props }: { props: BlockProps } = $props();
	let closed = $state(false);
</script>

{#if !closed && props.text}
	<div class={bg(props.background) || 'bg-ink text-white'} transition:slide={slideOpen()}>
		<div class="mx-auto flex max-w-7xl items-center gap-4 px-4 py-2 text-xs">
			<p class="min-w-0 flex-1 truncate">
				{#if props.href}
					<a href={props.href} class="hover:underline">{props.text}</a>
				{:else}
					{props.text}
				{/if}
				{#if props.textBn}<span class="opacity-80"> · {props.textBn}</span>{/if}
			</p>
			{#if props.dismissible}
				<button
					class="shrink-0 opacity-80 hover:opacity-100"
					aria-label="Close"
					onclick={() => (closed = true)}
				>
					<X size={14} />
				</button>
			{/if}
		</div>
	</div>
{/if}
