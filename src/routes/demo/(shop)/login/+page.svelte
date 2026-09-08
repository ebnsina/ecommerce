<script lang="ts">
	import { enhance } from '$app/forms';
	import { fade } from 'svelte/transition';
	import { Smartphone, ArrowLeft, ShieldCheck } from '@lucide/svelte';
	import { formatPhone } from '$lib/phone';
	import { fadeIn } from '$lib/motion';
	import Button from '$lib/ui/Button.svelte';
	import Input from '$lib/ui/Input.svelte';

	let { data, form } = $props();

	let phone = $state('');
	let submitting = $state(false);

	/* The server tells us which step to show; it survives a failed code too. */
	const step = $derived(form?.step === 'code' ? 'code' : 'phone');
	const sentTo = $derived(form?.phone ?? phone);
</script>

<svelte:head><title>Sign in · {data.settings.store.name}</title></svelte:head>

<div class="mx-auto max-w-md px-4 py-16">
	<div class="rounded-3xl border border-border bg-surface p-8" in:fade={fadeIn()}>
		{#if step === 'phone'}
			<span class="grid size-11 place-items-center rounded-2xl bg-primary-soft text-primary">
				<Smartphone size={20} />
			</span>
			<h1 class="mt-4 text-xl font-semibold tracking-tight text-ink">Sign in</h1>
			<p class="mt-1 text-sm text-ink-muted">
				{#if data.otpEnabled}
					We will send a code to your mobile. No password to remember.
				{:else}
					Use your mobile number and password.
				{/if}
			</p>

			<form
				method="POST"
				action={data.otpEnabled ? '?/sendCode' : '?/password'}
				use:enhance={() => {
					submitting = true;
					return async ({ update }) => {
						submitting = false;
						await update({ reset: false });
					};
				}}
				class="mt-6 flex flex-col gap-4"
			>
				<input type="hidden" name="next" value={data.next} />
				<Input
					label="Mobile number"
					name="phone"
					bind:value={phone}
					placeholder="01XXXXXXXXX"
					inputmode="tel"
					autocomplete="tel"
					numeric
					required
					hint="Bangladeshi mobile numbers only."
				/>

				{#if !data.otpEnabled}
					<Input
						label="Password"
						name="password"
						type="password"
						autocomplete="current-password"
						required
						hint="New here? Signing in creates your account."
					/>
				{/if}

				{#if form?.error}
					<p class="text-sm text-sale" role="alert">{form.error}</p>
				{/if}

				<Button type="submit" block loading={submitting}>
					{data.otpEnabled ? 'Send code' : 'Sign in'}
				</Button>
			</form>
		{:else}
			<span class="grid size-11 place-items-center rounded-2xl bg-primary-soft text-primary">
				<ShieldCheck size={20} />
			</span>
			<h1 class="mt-4 text-xl font-semibold tracking-tight text-ink">Enter the code</h1>
			<p class="mt-1 text-sm text-ink-muted">
				Sent to <span class="num font-medium text-ink">{formatPhone(sentTo)}</span>
			</p>

			<form
				method="POST"
				action="?/verify"
				use:enhance={() => {
					submitting = true;
					return async ({ update }) => {
						submitting = false;
						await update({ reset: false });
					};
				}}
				class="mt-6 flex flex-col gap-4"
			>
				<input type="hidden" name="phone" value={sentTo} />
				<input type="hidden" name="next" value={data.next} />
				<Input
					label="6-digit code"
					name="code"
					inputmode="numeric"
					autocomplete="one-time-code"
					maxlength={6}
					numeric
					required
					class="[&_input]:text-center [&_input]:text-lg [&_input]:tracking-[0.4em]"
				/>

				{#if form?.error}
					<p class="text-sm text-sale" role="alert">{form.error}</p>
				{/if}

				<Button type="submit" block loading={submitting}>Verify and continue</Button>
			</form>

			<form method="POST" action="?/sendCode" use:enhance class="mt-4">
				<input type="hidden" name="phone" value={sentTo} />
				<button
					class="flex items-center gap-1.5 text-sm text-ink-muted transition-colors hover:text-primary"
				>
					<ArrowLeft size={14} />
					Send a new code
				</button>
			</form>
		{/if}
	</div>

	<p class="mt-4 text-center text-xs text-ink-faint">
		New here? Signing in with your number creates your account.
	</p>
</div>
