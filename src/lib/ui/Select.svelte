<script lang="ts">
	import { ChevronDown } from '@lucide/svelte';
	import { fly } from 'svelte/transition';
	import { flyUp } from '$lib/motion';

	type Option = { value: string; label: string; hint?: string };

	let {
		value = $bindable(''),
		options,
		label,
		placeholder = 'Select…',
		name,
		error,
		hint,
		disabled = false,
		onchange,
		id = `s-${Math.random().toString(36).slice(2, 8)}`,
		class: klass = ''
	}: {
		value?: string;
		options: Option[];
		label?: string;
		placeholder?: string;
		name?: string;
		error?: string;
		hint?: string;
		disabled?: boolean;
		id?: string;
		class?: string;
		onchange?: (value: string) => void;
	} = $props();

	let open = $state(false);
	let active = $state(0);
	let query = $state('');

	/* Long lists (64 districts, 141 thanas) are unusable without filtering. */
	const searchable = $derived(options.length > 8);
	const shown = $derived(
		query.trim()
			? options.filter((o) => o.label.toLowerCase().includes(query.trim().toLowerCase()))
			: options
	);
	/* Nothing to choose from is the same as disabled — say so rather than
	   opening an empty list. */
	const isDisabled = $derived(disabled || options.length === 0);
	let root: HTMLDivElement;
	let listEl = $state<HTMLElement | null>(null);

	const selected = $derived(options.find((o) => o.value === value) ?? null);

	function openList() {
		active = Math.max(
			0,
			options.findIndex((o) => o.value === value)
		);
		open = true;
	}

	function pick(i: number) {
		const opt = shown[i];
		if (!opt) return;
		value = opt.value;
		open = false;
		query = '';
		onchange?.(value);
	}

	function onKey(e: KeyboardEvent) {
		if (!open) {
			if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				openList();
			}
			return;
		}
		if (e.key === 'Escape') return void (open = false);
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			active = (active + 1) % Math.max(1, shown.length);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			active = (active - 1 + shown.length) % Math.max(1, shown.length);
		} else if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			pick(active);
		} else if (e.key === 'Home') {
			active = 0;
		} else if (e.key === 'End') {
			active = shown.length - 1;
		}
	}

	$effect(() => {
		if (!open) return;
		listEl
			?.querySelector<HTMLElement>('[data-active="true"]')
			?.scrollIntoView({ block: 'nearest' });
		const onPointer = (e: PointerEvent) => {
			if (!root.contains(e.target as Node)) open = false;
		};
		window.addEventListener('pointerdown', onPointer);
		return () => window.removeEventListener('pointerdown', onPointer);
	});
</script>

<div class="flex flex-col gap-1.5 {klass}" bind:this={root}>
	{#if label}
		<span id="{id}-label" class="text-sm font-medium text-ink">{label}</span>
	{/if}

	{#if name}<input type="hidden" {name} {value} />{/if}

	<div class="relative">
		<button
			type="button"
			{id}
			role="combobox"
			aria-controls="{id}-list"
			aria-expanded={open}
			aria-activedescendant={open ? `${id}-opt-${active}` : undefined}
			aria-labelledby={label ? `${id}-label ${id}` : undefined}
			aria-invalid={error ? 'true' : undefined}
			aria-describedby={error || hint ? `${id}-msg` : undefined}
			disabled={isDisabled}
			class="flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-border
			       bg-surface px-3.5 text-sm transition-colors duration-[180ms] ease-brand
			       disabled:cursor-not-allowed disabled:bg-surface-alt disabled:text-ink-faint
			       {error ? 'border-sale' : ''}"
			onclick={() => (open ? (open = false) : openList())}
			onkeydown={onKey}
		>
			<span class={selected ? 'text-ink' : 'text-ink-faint'}>
				{selected?.label ?? placeholder}
			</span>
			<ChevronDown
				size={16}
				class="shrink-0 text-ink-muted transition-transform duration-[180ms] ease-brand {open
					? 'rotate-180'
					: ''}"
			/>
		</button>

		{#if open}
			<ul
				bind:this={listEl}
				id="{id}-list"
				role="listbox"
				tabindex="-1"
				class="absolute top-full z-50 mt-2 max-h-64 w-full overflow-auto rounded-2xl border
				       border-border bg-surface p-1.5"
				transition:fly={flyUp()}
			>
				{#if searchable}
					<li class="p-1 pb-2">
						<!-- svelte-ignore a11y_autofocus -->
						<input
							bind:value={query}
							autofocus
							placeholder="Type to filter…"
							aria-label="Filter options"
							class="h-9 w-full rounded-lg border border-border bg-surface px-2.5 text-sm text-ink
							       placeholder:text-ink-faint"
							onkeydown={onKey}
							oninput={() => (active = 0)}
						/>
					</li>
				{/if}

				{#each shown as opt, i (opt.value)}
					<!-- Keyboard lives on the combobox button (aria-activedescendant); the
					     option itself is pointer-only by design. -->
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<li
						id="{id}-opt-{i}"
						role="option"
						aria-selected={opt.value === value}
						data-active={i === active}
						class="flex cursor-pointer flex-col gap-0.5 rounded-xl px-3 py-2 text-sm
						       transition-colors duration-[180ms] ease-brand
						       {i === active ? 'bg-surface-alt' : ''}
						       {opt.value === value ? 'font-medium text-primary' : 'text-ink'}"
						onpointerenter={() => (active = i)}
						onclick={() => pick(i)}
					>
						<span>{opt.label}</span>
						{#if opt.hint}<span class="text-xs text-ink-muted">{opt.hint}</span>{/if}
					</li>
				{:else}
					<li class="px-3 py-6 text-center text-sm text-ink-faint">No matches.</li>
				{/each}
			</ul>
		{/if}
	</div>

	<!-- Same shape as Input: the error replaces the hint rather than stacking
	     under it, and both are announced through aria-describedby. -->
	{#if error || hint}
		<p id="{id}-msg" class="text-xs {error ? 'text-sale' : 'text-ink-muted'}">{error ?? hint}</p>
	{/if}
</div>
