<script lang="ts">
	import { bg } from './backgrounds';

	let { props }: { props: Record<string, any> } = $props();

	const banners = $derived((props.banners ?? []).filter((b: any) => b.image));
	/** '2+3' splits the row; the others are a single row. */
	const top = $derived(props.layout === '2+3' ? banners.slice(0, 2) : banners);
	const bottom = $derived(props.layout === '2+3' ? banners.slice(2, 5) : []);
	const cols = (n: number) => (n >= 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2');
	const tone = $derived(bg(props.background));
</script>

{#if banners.length}
	<section class="mx-auto max-w-7xl px-4 py-4">
		<div class="flex flex-col gap-4 {tone} {tone ? 'rounded-3xl p-4' : ''}">
			<div class="grid gap-4 {cols(top.length)}">
				{#each top as b (b.image)}
					<a href={b.href || '#'} class="overflow-hidden rounded-3xl">
						<img src={b.image} alt={b.alt ?? ''} class="size-full object-cover" />
					</a>
				{/each}
			</div>
			{#if bottom.length}
				<div class="grid gap-4 {cols(bottom.length)}">
					{#each bottom as b (b.image)}
						<a href={b.href || '#'} class="overflow-hidden rounded-3xl">
							<img src={b.image} alt={b.alt ?? ''} class="size-full object-cover" />
						</a>
					{/each}
				</div>
			{/if}
		</div>
	</section>
{/if}
