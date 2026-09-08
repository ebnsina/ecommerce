<script lang="ts">
	import { PhoneCall, Check, Package, Truck, CircleCheck, Undo2, Ban } from '@lucide/svelte';

	/**
	 * Status tag: neutral chip, ink text, and colour carried only by the icon.
	 *
	 * Text on a tinted chip has to clear 4.5:1 for every status, which forces
	 * muddy dark hues. An icon is a graphic — it needs 3:1 — so the colour can
	 * stay bright and legible while the label stays plain black on white.
	 */
	const tone: Record<string, { Icon: typeof Check; color: string; label: string }> = {
		pending: { Icon: PhoneCall, color: 'var(--color-warn-fg)', label: 'Awaiting call' },
		confirmed: { Icon: Check, color: 'var(--color-info-fg)', label: 'Confirmed' },
		packed: { Icon: Package, color: 'var(--color-active-fg)', label: 'Packed' },
		shipped: { Icon: Truck, color: 'var(--color-transit-fg)', label: 'On the way' },
		delivered: { Icon: CircleCheck, color: 'var(--color-ok-fg)', label: 'Delivered' },
		returned: { Icon: Undo2, color: 'var(--color-warm-fg)', label: 'Returned' },
		cancelled: { Icon: Ban, color: 'var(--color-bad-fg)', label: 'Cancelled' }
	};

	let { status }: { status: string } = $props();

	const entry = $derived(
		tone[status] ?? { Icon: Check, color: 'var(--color-ink-muted)', label: status }
	);
</script>

<span
	class="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-surface
	       px-2 py-0.5 text-xs font-medium whitespace-nowrap text-ink"
>
	<entry.Icon size={13} style="color: {entry.color}" class="shrink-0" />
	{entry.label}
</span>
