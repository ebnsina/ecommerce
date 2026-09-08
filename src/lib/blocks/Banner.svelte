<script lang="ts">
	import Carousel from './Carousel.svelte';
	import { bg, isDark } from './backgrounds';

	let { props }: { props: Record<string, any> } = $props();

	const slides = $derived((props.slides ?? []).filter((s: any) => s.image));
	const tone = $derived(bg(props.background));
	const dark = $derived(isDark(props.background));
	const hasCopy = $derived(!!(props.heading || props.subtitle));
	const contained = $derived(props.contained !== false);
</script>

{#if slides.length || hasCopy || tone}
	<section class={contained ? 'mx-auto max-w-7xl px-4 py-4' : 'py-4'}>
		<div class="overflow-hidden {contained ? 'rounded-3xl' : ''} {tone}">
			{#if hasCopy}
				<!-- Coloured band with its own copy: a section divider that carries a message. -->
				<div class="flex flex-wrap items-center gap-6 px-6 py-10 sm:px-10">
					<div class="min-w-56 flex-1">
						{#if props.heading}
							<h2 class="text-2xl font-semibold tracking-tight sm:text-3xl">{props.heading}</h2>
						{/if}
						{#if props.subtitle}
							<p class="mt-1.5 text-sm {dark ? 'text-white/80' : 'text-ink-muted'}">
								{props.subtitle}
							</p>
						{/if}
						{#if props.cta && props.slides?.[0]?.href}
							<a
								href={props.slides[0].href}
								class="mt-5 inline-flex rounded-xl px-5 py-2.5 text-sm font-medium transition-colors
								       duration-[180ms] ease-brand
								       {dark
									? 'bg-surface text-primary hover:bg-brand-50'
									: 'bg-primary text-white hover:bg-primary-hover'}"
							>
								{props.cta}
							</a>
						{/if}
					</div>

					{#if slides.length}
						<img
							src={slides[0].image}
							alt={slides[0].alt ?? ''}
							class="max-h-48 w-full max-w-md flex-1 rounded-2xl object-cover"
						/>
					{/if}
				</div>
			{:else if slides.length}
				<Carousel count={slides.length} interval={props.interval} ratio={props.aspect || '3 / 1'}>
					{#snippet slide(i)}
						<a href={slides[i].href || '#'} class="block size-full">
							<img src={slides[i].image} alt={slides[i].alt ?? ''} class="size-full object-cover" />
						</a>
					{/snippet}
				</Carousel>
			{/if}
		</div>
	</section>
{/if}
