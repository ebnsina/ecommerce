<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';

	type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
	type Size = 'sm' | 'md' | 'lg';

	let {
		variant = 'primary',
		size = 'md',
		href,
		block = false,
		loading = false,
		children,
		class: klass = '',
		...rest
	}: {
		variant?: Variant;
		size?: Size;
		href?: string;
		block?: boolean;
		loading?: boolean;
		children: Snippet;
		class?: string;
	} & HTMLButtonAttributes &
		HTMLAnchorAttributes = $props();

	const variants: Record<Variant, string> = {
		primary: 'bg-primary text-white hover:bg-primary-hover border-transparent',
		secondary: 'bg-surface text-ink border-border hover:border-brand-300 hover:text-primary',
		ghost: 'bg-transparent text-ink-muted border-transparent hover:bg-surface-alt hover:text-ink',
		danger: 'bg-sale text-white border-transparent hover:brightness-90'
	};

	/* Radius scales with the control — a 36px button with a 16px corner reads as a pill. */
	const sizes: Record<Size, string> = {
		sm: 'h-9 px-3.5 text-sm gap-1.5 rounded-lg',
		md: 'h-11 px-5 text-sm gap-2 rounded-xl',
		lg: 'h-13 px-7 text-base gap-2.5 rounded-2xl'
	};

	const base =
		'inline-flex items-center justify-center border font-medium tracking-tight ' +
		'transition-[background-color,border-color,color,opacity] duration-[180ms] ease-brand ' +
		'disabled:opacity-50 disabled:pointer-events-none select-none';
</script>

{#snippet inner()}
	{#if loading}
		<span
			class="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
			aria-hidden="true"
		></span>
	{/if}
	{@render children()}
{/snippet}

{#if href}
	<a
		{href}
		class="{base} {variants[variant]} {sizes[size]} {block ? 'w-full' : ''} {klass}"
		aria-busy={loading || undefined}
		{...rest}
	>
		{@render inner()}
	</a>
{:else}
	<button
		class="{base} {variants[variant]} {sizes[size]} {block ? 'w-full' : ''} {klass}"
		disabled={loading || (rest as HTMLButtonAttributes).disabled}
		aria-busy={loading || undefined}
		{...rest}
	>
		{@render inner()}
	</button>
{/if}
