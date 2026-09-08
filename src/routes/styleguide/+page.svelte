<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import Button from '$lib/ui/Button.svelte';
	import Input from '$lib/ui/Input.svelte';
	import Price from '$lib/ui/Price.svelte';
	import { fadeIn, flyUp } from '$lib/motion';

	let phone = $state('');
	let open = $state(false);
</script>

<main class="mx-auto max-w-4xl px-6 py-16" in:fade={fadeIn()}>
	<h1 class="text-3xl font-semibold tracking-tight text-ink">Design tokens</h1>
	<p class="mt-2 text-sm text-ink-muted">
		Mona Sans for text, Geist Mono for numbers. rounded-xl controls, rounded-3xl cards, borders not
		shadows.
	</p>

	<section class="mt-10 rounded-3xl border border-border p-6">
		<h2 class="mb-4 text-sm font-medium text-ink">Brand ramp</h2>
		<div class="flex flex-wrap gap-2">
			{#each ['50', '100', '200', '300', '400', '500', '600', '700', '800'] as step (step)}
				<div class="text-center">
					<div class="size-14 rounded-xl border border-border bg-brand-{step}"></div>
					<span class="num mt-1 block text-[11px] text-ink-muted">{step}</span>
				</div>
			{/each}
		</div>
		<p class="mt-4 text-xs text-ink-muted">
			700 = primary (5.68:1). 400 and lighter are fills only — never text.
		</p>
	</section>

	<section class="mt-6 rounded-3xl border border-border p-6">
		<h2 class="mb-4 text-sm font-medium text-ink">Buttons</h2>
		<div class="flex flex-wrap items-center gap-3">
			<Button>Buy Now</Button>
			<Button variant="secondary">Add to cart</Button>
			<Button variant="ghost">More products</Button>
			<Button variant="danger">Cancel order</Button>
			<Button size="sm" variant="secondary">Small</Button>
			<Button size="lg">Large</Button>
			<Button loading>Placing order</Button>
		</div>
	</section>

	<section class="mt-6 rounded-3xl border border-border p-6">
		<h2 class="mb-4 text-sm font-medium text-ink">Inputs &amp; prices</h2>
		<div class="grid gap-4 sm:grid-cols-2">
			<Input label="Mobile number" placeholder="01XXXXXXXXX" numeric bind:value={phone} />
			<Input label="Coupon" placeholder="MAD8" hint="Case insensitive" />
			<Input label="Invalid example" value="017" error="Enter an 11-digit number" numeric />
			<div class="flex flex-col justify-end gap-3 pb-1">
				<Price price={469900} compareAt={499900} size="lg" />
				<Price price={4200} compareAt={5000} />
				<Price price={513000} size="sm" />
			</div>
		</div>
	</section>

	<section class="mt-6 rounded-3xl border border-border p-6">
		<h2 class="mb-4 text-sm font-medium text-ink">Motion</h2>
		<Button variant="secondary" onclick={() => (open = !open)}>Toggle panel</Button>
		{#if open}
			<div
				class="mt-4 rounded-3xl border border-border bg-primary-soft p-5"
				transition:fly={flyUp()}
			>
				<p class="text-sm text-ink">
					svelte/transition only — 180ms, cubic-bezier(.2,.7,.3,1), collapses to 0 under
					prefers-reduced-motion.
				</p>
			</div>
		{/if}
	</section>
</main>
