<script lang="ts">
	/** Status colours are reserved — same mapping in the admin and the storefront. */
	const tone: Record<string, string> = {
		pending: 'var(--color-brand-300)',
		confirmed: 'var(--color-brand-500)',
		packed: 'var(--color-brand-600)',
		shipped: 'var(--color-brand-700)',
		delivered: 'var(--color-success)',
		returned: 'var(--color-star)',
		cancelled: 'var(--color-sale)'
	};

	const label: Record<string, string> = {
		pending: 'Awaiting confirmation',
		confirmed: 'Confirmed',
		packed: 'Packed',
		shipped: 'On the way',
		delivered: 'Delivered',
		returned: 'Returned',
		cancelled: 'Cancelled'
	};

	let { status }: { status: string } = $props();
</script>

<span
	class="inline-flex shrink-0 items-center rounded-lg px-2 py-0.5 text-xs font-medium"
	style="background:color-mix(in oklab, {tone[status]} 12%, transparent); color:{tone[status]}"
>
	{label[status] ?? status}
</span>
