<script lang="ts">
	import { untrack } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { Search, Users } from '@lucide/svelte';
	import { formatTk } from '$lib/money';
	import { formatPhone } from '$lib/phone';
	import Input from '$lib/ui/Input.svelte';
	import Button from '$lib/ui/Button.svelte';

	let { data } = $props();
	let q = $state(untrack(() => data.filters.q));

	function apply(patch: Record<string, string>) {
		const params = new URLSearchParams(page.url.searchParams);
		for (const [k, v] of Object.entries(patch)) v ? params.set(k, v) : params.delete(k);
		params.delete('page');
		goto(`?${params}`, { keepFocus: true, noScroll: true });
	}

	let timer: ReturnType<typeof setTimeout>;
	const search = (v: string) => {
		clearTimeout(timer);
		timer = setTimeout(() => apply({ q: v }), 250);
	};
</script>

<svelte:head><title>Customers · Admin</title></svelte:head>

<h1 class="text-2xl font-semibold tracking-tight text-ink">Customers</h1>
<p class="mt-1 text-sm text-ink-muted"><span class="num">{data.total}</span> customers</p>

<div class="mt-6 flex flex-wrap items-end gap-3">
	<div class="relative min-w-56 flex-1">
		<Input
			label="Search"
			placeholder="Phone or name"
			bind:value={q}
			oninput={(e) => search(e.currentTarget.value)}
			class="[&_input]:pl-9"
		/>
		<Search size={15} class="pointer-events-none absolute bottom-3.5 left-3 text-ink-faint" />
	</div>
</div>

{#if data.tags.length}
	<div class="mt-3 flex flex-wrap gap-2">
		<button
			class="rounded-xl border px-2.5 py-1 text-xs transition-colors
			       {data.filters.tag
				? 'border-border text-ink-muted'
				: 'border-primary bg-primary-soft text-primary'}"
			onclick={() => apply({ tag: '' })}
		>
			All
		</button>
		{#each data.tags as t (t)}
			<button
				class="rounded-xl border px-2.5 py-1 text-xs transition-colors
				       {data.filters.tag === t
					? 'border-primary bg-primary-soft text-primary'
					: 'border-border text-ink-muted hover:border-brand-300'}"
				onclick={() => apply({ tag: t })}
			>
				{t}
			</button>
		{/each}
	</div>
{/if}

<div class="mt-4 overflow-hidden rounded-3xl border border-border bg-surface">
	<div class="overflow-x-auto">
		<table class="w-full text-sm">
			<thead>
				<tr class="border-b border-border text-left text-xs text-ink-muted">
					<th class="px-4 py-3 font-medium">Customer</th>
					<th class="px-4 py-3 font-medium">Tags</th>
					<th class="px-4 py-3 text-right font-medium">Orders</th>
					<th class="px-4 py-3 text-right font-medium">Spent</th>
				</tr>
			</thead>
			<tbody>
				{#each data.rows as c (c.id)}
					<tr class="border-b border-border transition-colors last:border-0 hover:bg-surface-alt">
						<td class="px-4 py-3">
							<a href="/admin/customers/{c.id}">
								<span class="block font-medium text-ink">{c.name ?? 'Unnamed'}</span>
								<span class="num block text-xs text-ink-faint">{formatPhone(c.phone)}</span>
							</a>
						</td>
						<td class="px-4 py-3">
							<span class="flex flex-wrap gap-1">
								{#each c.tags as t (t)}
									<span class="rounded-lg bg-surface-alt px-2 py-0.5 text-xs text-ink-muted"
										>{t}</span
									>
								{/each}
							</span>
						</td>
						<td class="num px-4 py-3 text-right text-ink">{c.orders}</td>
						<td class="num px-4 py-3 text-right font-medium text-ink">{formatTk(c.spent)}</td>
					</tr>
				{:else}
					<tr>
						<td colspan="4" class="px-4 py-16 text-center text-ink-faint">
							<Users size={22} class="mx-auto mb-3" />
							No customers yet.
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>

{#if data.pages > 1}
	<div class="mt-4 flex items-center justify-between">
		<p class="text-sm text-ink-muted">
			Page <span class="num">{data.page}</span> of <span class="num">{data.pages}</span>
		</p>
		<div class="flex gap-2">
			<Button
				size="sm"
				variant="secondary"
				disabled={data.page <= 1}
				onclick={() => apply({ page: String(data.page - 1) })}
			>
				Previous
			</Button>
			<Button
				size="sm"
				variant="secondary"
				disabled={data.page >= data.pages}
				onclick={() => apply({ page: String(data.page + 1) })}
			>
				Next
			</Button>
		</div>
	</div>
{/if}
