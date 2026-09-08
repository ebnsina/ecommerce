<script lang="ts">
	import { CircleAlert, Clock, RotateCcw, Phone } from '@lucide/svelte';
	import { formatTk } from '$lib/money';
	import Button from '$lib/ui/Button.svelte';

	let { data } = $props();

	const copy = {
		failed: {
			Icon: CircleAlert,
			title: 'The payment did not go through',
			body: 'Nothing has been taken from your account. Your order is saved — you can try paying again, or pay the courier at your door instead.'
		},
		cancelled: {
			Icon: RotateCcw,
			title: 'Payment cancelled',
			body: 'You stopped before paying, so nothing was taken. Your order is still here whenever you want it.'
		},
		pending: {
			Icon: Clock,
			title: 'We are still waiting on your bank',
			body: 'The bank has not confirmed this payment yet. It usually takes a moment. Your order is saved either way, and we will call you to sort it out.'
		}
	} as const;

	const state = $derived(copy[data.outcome]);
</script>

<svelte:head><title>Payment · {data.settings.store.name}</title></svelte:head>

<div class="mx-auto max-w-lg px-4 py-16">
	<div class="flex flex-col items-center text-center">
		<span class="grid size-14 place-items-center rounded-2xl bg-surface-alt text-warn-fg">
			<state.Icon size={26} />
		</span>
		<h1 class="mt-4 text-2xl font-semibold tracking-tight text-ink">{state.title}</h1>
		<p class="mt-2 text-sm text-ink-muted">{state.body}</p>

		<p class="mt-4 text-sm text-ink">
			Order <span class="num font-medium">{data.order.number}</span>
			· <span class="num font-medium">{formatTk(data.order.total)}</span>
		</p>

		<div class="mt-6 flex flex-wrap justify-center gap-2">
			<Button href="/demo/order/{data.order.number}">See the order</Button>
			{#if data.settings.store.phone}
				<Button href="tel:{data.settings.store.phone}" variant="secondary">
					<Phone size={16} />
					Call us
				</Button>
			{/if}
		</div>
	</div>
</div>
