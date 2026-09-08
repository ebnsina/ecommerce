<script lang="ts">
	import { Bell, PhoneCall, PackageX } from '@lucide/svelte';
	import Dropdown from '$lib/ui/Dropdown.svelte';

	type Notifications = {
		pending: { id: string; number: string; name: string; createdAt: Date }[];
		lowStock: { id: string; title: string; stock: number }[];
		total: number;
	};

	let { notifications }: { notifications: Notifications } = $props();

	/** '3h ago' — good enough; no date library for one label. */
	const bellLabel = $derived(
		notifications.total > 0
			? `Notifications, ${notifications.total} needing attention`
			: 'Notifications'
	);

	function ago(d: Date | string) {
		const mins = Math.round((Date.now() - new Date(d).getTime()) / 60000);
		if (mins < 60) return `${mins}m ago`;
		if (mins < 1440) return `${Math.round(mins / 60)}h ago`;
		return `${Math.round(mins / 1440)}d ago`;
	}
</script>

<Dropdown align="end">
	{#snippet trigger({ open })}
		<span
			class="relative grid size-10 place-items-center rounded-xl transition-colors duration-[180ms] ease-brand
			       {open ? 'bg-surface-alt text-ink' : 'text-ink-muted hover:bg-surface-alt hover:text-ink'}"
			aria-label={bellLabel}
		>
			<Bell size={18} />
			{#if notifications.total > 0}
				<span
					class="num absolute -top-0.5 -right-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-sale
					       px-1 text-[10px] font-semibold text-white ring-2 ring-surface"
				>
					{notifications.total > 9 ? '9+' : notifications.total}
				</span>
			{/if}
		</span>
	{/snippet}

	<div class="w-80">
		<p class="px-3 py-2 text-sm font-medium text-ink">Needs attention</p>

		{#if notifications.total === 0}
			<p class="px-3 py-8 text-center text-sm text-ink-faint">All clear.</p>
		{/if}

		{#if notifications.pending.length}
			<p class="px-3 pt-2 pb-1 text-[11px] font-medium tracking-wide text-ink-faint uppercase">
				Awaiting confirmation call
			</p>
			{#each notifications.pending as o (o.id)}
				<a
					href="/admin/orders/{o.id}"
					role="menuitem"
					class="flex items-start gap-2.5 rounded-xl px-3 py-2 transition-colors duration-[180ms] ease-brand hover:bg-surface-alt"
				>
					<PhoneCall size={16} class="mt-0.5 shrink-0 text-primary" />
					<span class="min-w-0 flex-1">
						<span class="block truncate text-sm text-ink">{o.name}</span>
						<span class="num block text-xs text-ink-muted">{o.number} · {ago(o.createdAt)}</span>
					</span>
				</a>
			{/each}
		{/if}

		{#if notifications.lowStock.length}
			<p class="px-3 pt-3 pb-1 text-[11px] font-medium tracking-wide text-ink-faint uppercase">
				Running out
			</p>
			{#each notifications.lowStock as p (p.id)}
				<a
					href="/admin/products/{p.id}"
					role="menuitem"
					class="flex items-start gap-2.5 rounded-xl px-3 py-2 transition-colors duration-[180ms] ease-brand hover:bg-surface-alt"
				>
					<PackageX size={16} class="mt-0.5 shrink-0 text-star" />
					<span class="min-w-0 flex-1">
						<span class="block truncate text-sm text-ink">{p.title}</span>
						<span class="num block text-xs text-ink-muted">{p.stock} left</span>
					</span>
				</a>
			{/each}
		{/if}
	</div>
</Dropdown>
