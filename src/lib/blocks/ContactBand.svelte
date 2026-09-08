<script lang="ts">
	import { Phone, MessageCircle, ArrowRight } from '@lucide/svelte';
	import { page } from '$app/state';
	import Button from '$lib/ui/Button.svelte';
	import { formatPhone } from '$lib/phone';

	let { props }: { props: Record<string, any> } = $props();

	/* The shop phone lives in Settings; repeating it in a block would be a
	   second place to forget to update. */
	const store = $derived((page.data.settings as any)?.store ?? {});
	const phone = $derived(String(props.phone || store.phone || '').trim());
	const whatsapp = $derived(String(props.whatsapp || phone).replace(/\D/g, ''));
</script>

<!-- Aurora background: blurred radial blobs drifting over a dark base. Pure CSS,
     no shader/canvas — it costs nothing and degrades to a flat colour. -->
<section class="relative isolate mt-8 overflow-hidden bg-ink">
	<div class="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
		<span class="aurora a1"></span>
		<span class="aurora a2"></span>
		<span class="aurora a3"></span>
		<span class="aurora a4"></span>
	</div>

	<div class="mx-auto flex max-w-7xl flex-wrap items-center gap-6 px-4 py-14">
		<div class="min-w-64 flex-1">
			<p class="text-xl font-semibold tracking-tight text-white">{props.heading}</p>
			<p class="mt-1 text-sm text-white/70">{props.subtitle}</p>
		</div>

		<div class="flex flex-wrap items-center gap-2">
			{#if phone}
				<a
					href="tel:{phone}"
					class="flex h-11 items-center gap-2 rounded-xl bg-white px-4 text-sm font-medium text-ink
					       transition-colors duration-[180ms] ease-brand hover:bg-white/90"
				>
					<Phone size={16} />
					<span class="num">{formatPhone(phone)}</span>
				</a>
			{/if}
			{#if whatsapp}
				<a
					href="https://wa.me/{whatsapp.startsWith('88') ? whatsapp : '88' + whatsapp}"
					class="flex h-11 items-center gap-2 rounded-xl border border-white/25 px-4 text-sm
					       font-medium text-white backdrop-blur-sm transition-colors duration-[180ms]
					       ease-brand hover:border-white/50"
				>
					<MessageCircle size={16} />
					{props.chatLabel || 'Order on WhatsApp'}
				</a>
			{/if}
			{#if props.ctaHref}
				<Button href={props.ctaHref} variant="secondary" class="border-transparent">
					{props.cta || 'See offers'}
					<ArrowRight size={16} />
				</Button>
			{/if}
		</div>
	</div>
</section>

<style>
	.aurora {
		position: absolute;
		border-radius: 9999px;
		filter: blur(70px);
		will-change: transform;
	}

	/* Brand hues only — the aurora is decoration, so saturation is free here. */
	.a1 {
		top: -30%;
		left: -5%;
		width: 45%;
		height: 180%;
		background: var(--color-brand-500);
		opacity: 0.5;
	}
	.a2 {
		top: -60%;
		left: 25%;
		width: 40%;
		height: 200%;
		background: var(--color-brand-300);
		opacity: 0.35;
	}
	.a3 {
		top: -20%;
		right: 10%;
		width: 35%;
		height: 170%;
		background: var(--color-brand-700);
		opacity: 0.6;
	}
	.a4 {
		bottom: -80%;
		right: -5%;
		width: 40%;
		height: 180%;
		background: color-mix(in oklab, var(--color-brand-200) 70%, white);
		opacity: 0.25;
	}

	@media (prefers-reduced-motion: no-preference) {
		.a1 {
			animation: drift-a 19s ease-in-out infinite alternate;
		}
		.a2 {
			animation: drift-b 23s ease-in-out infinite alternate;
		}
		.a3 {
			animation: drift-a 27s ease-in-out infinite alternate-reverse;
		}
		.a4 {
			animation: drift-b 31s ease-in-out infinite alternate;
		}
	}

	@keyframes drift-a {
		from {
			transform: translate3d(0, 0, 0) scale(1);
		}
		to {
			transform: translate3d(14%, -8%, 0) scale(1.25);
		}
	}
	@keyframes drift-b {
		from {
			transform: translate3d(0, 0, 0) scale(1.15);
		}
		to {
			transform: translate3d(-16%, 10%, 0) scale(0.95);
		}
	}
</style>
