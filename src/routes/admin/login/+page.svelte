<script lang="ts">
	import { fade } from 'svelte/transition';
	import { page } from '$app/state';
	import Button from '$lib/ui/Button.svelte';
	import Input from '$lib/ui/Input.svelte';
	import { fadeIn } from '$lib/motion';

	let { form } = $props();
	let submitting = $state(false);
</script>

<svelte:head><title>Sign in · Admin</title></svelte:head>

<div class="flex min-h-screen items-center justify-center bg-surface-alt px-6">
	<form
		method="POST"
		class="w-full max-w-sm rounded-3xl border border-border bg-surface p-8"
		in:fade={fadeIn()}
		onsubmit={() => (submitting = true)}
	>
		<h1 class="text-xl font-semibold tracking-tight text-ink">Sign in</h1>
		<p class="mt-1 mb-6 text-sm text-ink-muted">Store administration</p>

		<input type="hidden" name="next" value={page.url.searchParams.get('next') ?? '/admin'} />

		<div class="flex flex-col gap-4">
			<Input
				label="Email"
				name="email"
				type="email"
				autocomplete="username"
				required
				value={form?.email ?? ''}
			/>
			<Input
				label="Password"
				name="password"
				type="password"
				autocomplete="current-password"
				required
			/>
		</div>

		{#if form?.error}
			<p class="mt-4 text-sm text-sale" role="alert">{form.error}</p>
		{/if}

		<Button class="mt-6" block loading={submitting} type="submit">Sign in</Button>
	</form>
</div>
