<script lang="ts">
	import Input from '$lib/ui/Input.svelte';
	import Select from '$lib/ui/Select.svelte';
	import Button from '$lib/ui/Button.svelte';
	import { SHOP } from '$lib/paths';

	/**
	 * Four questions, and only the first two are required.
	 *
	 * Every field past a name and a number costs answers, so the rest are
	 * optional and phrased as things a shop owner enjoys telling you rather
	 * than a form to be got through.
	 */
	let {
		source = 'demo',
		error,
		field,
		next = SHOP
	}: { source?: string; error?: string; field?: 'name' | 'phone'; next?: string } = $props();

	const sellsOn = [
		{ value: '', label: 'Not yet — this would be the first' },
		{ value: 'facebook', label: 'A Facebook page' },
		{ value: 'instagram', label: 'Instagram' },
		{ value: 'whatsapp', label: 'WhatsApp only' },
		{ value: 'shop', label: 'A shop with a shutter' },
		{ value: 'marketplace', label: 'Daraz or another marketplace' },
		{ value: 'website', label: 'A website already' }
	];
</script>

<form method="POST" action="{SHOP}/hello?/save" class="flex flex-col gap-4">
	<input type="hidden" name="redirectTo" value={next} />
	<input type="hidden" name="source" value={source} />

	<div class="grid gap-4 sm:grid-cols-2">
		<Input
			name="name"
			label="Your name"
			required
			autocomplete="name"
			error={field === 'name' ? error : undefined}
		/>
		<Input
			name="phone"
			label="Mobile number"
			required
			numeric
			inputmode="tel"
			autocomplete="tel"
			placeholder="01XXXXXXXXX"
			hint="So we can call you back."
			error={field === 'phone' ? error : undefined}
		/>
	</div>

	<Input
		name="shopName"
		label="Shop name"
		hint="If you have one yet."
		autocomplete="organization"
	/>
	<Input name="sells" label="What do you sell?" placeholder="Sarees, electronics, home things…" />
	<Select name="sellsOn" label="Where do you sell now?" options={sellsOn} value="" />

	{#if error && !field}
		<p class="text-sm text-sale" role="alert">{error}</p>
	{/if}

	<div class="mt-2 flex flex-wrap items-center gap-3">
		<Button type="submit">Take me in</Button>
	</div>

	<p class="text-xs text-ink-muted">
		Your number is used to call you about this and nothing else. It is never sold, and never given
		to anyone.
	</p>
</form>
