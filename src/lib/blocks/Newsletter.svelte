<script lang="ts">
	import { Mail } from '@lucide/svelte';
	import Button from '$lib/ui/Button.svelte';

	let { props }: { props: Record<string, any> } = $props();
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
		<div class="flex min-w-64 flex-1 items-center gap-4">
			<span
				class="grid size-11 shrink-0 place-items-center rounded-2xl bg-white/10 text-white backdrop-blur-sm"
			>
				<Mail size={20} />
			</span>
			<div>
				<p class="text-lg font-semibold tracking-tight text-white">{props.heading}</p>
				<p class="mt-0.5 text-sm text-white/70">{props.subtitle}</p>
			</div>
		</div>

		<form class="flex min-w-72 flex-1 gap-2">
			<input
				type="email"
				required
				placeholder="you@example.com"
				aria-label="Email address"
				class="h-11 min-w-0 flex-1 rounded-xl border border-white/15 bg-white/10 px-3.5 text-sm
				       text-white backdrop-blur-sm transition-colors duration-[180ms] ease-brand
				       placeholder:text-white/50 hover:border-white/30 focus:border-white/40"
			/>
			<Button type="submit" variant="secondary" class="border-transparent">
				{props.cta || 'Subscribe'}
			</Button>
		</form>
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
