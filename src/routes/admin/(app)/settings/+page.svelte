<script lang="ts">
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import { fade } from 'svelte/transition';
	import type { Snippet } from 'svelte';
	import {
		ChartNoAxesColumn,
		Check,
		Store,
		Megaphone,
		Truck,
		CreditCard,
		KeyRound,
		Share2,
		MessageCircle,
		ShieldCheck,
		Palette,
		PanelBottom,
		Search
	} from '@lucide/svelte';
	import { fadeIn } from '$lib/motion';
	import Button from '$lib/ui/Button.svelte';
	import Input from '$lib/ui/Input.svelte';
	import Checkbox from '$lib/ui/Checkbox.svelte';
	import Select from '$lib/ui/Select.svelte';
	import MediaPicker from '$lib/ui/MediaPicker.svelte';
	import FieldInput from '$lib/admin/FieldInput.svelte';
	import type { Field } from '$lib/blocks/schema';
	import { PRESETS, SURFACES, normalizeTheme } from '$lib/theme';

	let { data, form } = $props();

	/* Form defaults — read once, the inputs own them afterwards. */
	const s = untrack(() => data.settings);

	/* List-shaped settings reuse the block editor's repeater rather than a second
	   list UI, and post as JSON. */
	let assurances = $state(structuredClone(s.assurances ?? []));
	let paymentMethods = $state((s.footer?.paymentMethods ?? []).map((m) => ({ name: m })));
	let searchHints = $state((s.search?.hints ?? []).map((h) => ({ text: h })));

	const assuranceField: Field = {
		key: 'assurances',
		type: 'repeater',
		label: 'Reassurances',
		max: 6,
		itemKey: 'title',
		fields: [
			{
				key: 'icon',
				type: 'select',
				label: 'Icon',
				options: [
					{ value: 'Truck', label: 'Delivery' },
					{ value: 'RotateCcw', label: 'Returns' },
					{ value: 'ShieldCheck', label: 'Warranty' },
					{ value: 'Banknote', label: 'Cash on delivery' },
					{ value: 'Phone', label: 'Support' },
					{ value: 'Check', label: 'Tick' }
				]
			},
			{ key: 'title', type: 'text', label: 'Title' },
			{ key: 'note', type: 'text', label: 'Supporting line' }
		]
	};

	const paymentField: Field = {
		key: 'paymentMethods',
		type: 'repeater',
		label: 'Payment badges',
		max: 10,
		itemKey: 'name',
		fields: [{ key: 'name', type: 'text', label: 'Label' }]
	};

	const hintField: Field = {
		key: 'hints',
		type: 'repeater',
		label: 'Search hints',
		max: 8,
		itemKey: 'text',
		fields: [{ key: 'text', type: 'text', label: 'Hint' }]
	};

	const initialTheme = normalizeTheme(s.theme);
	let preset = $state<string>(initialTheme.preset);
	let surface = $state<string>(initialTheme.surface);

	let logoMode = $state(s.store.logo?.mode ?? 'text');
	let logoImage = $state(s.store.logo?.image ?? '');
	let otpEnabled = $state(s.auth.otpEnabled);

	const taka = (poisha: number) => String(Math.round(poisha) / 100);

	const zones = [
		{ key: 'inside_dhaka', fallback: 'Inside Dhaka' },
		{ key: 'suburban_dhaka', fallback: 'Dhaka Sub-urban' },
		{ key: 'outside_dhaka', fallback: 'Outside Dhaka' }
	];
</script>

<svelte:head><title>Settings · Admin</title></svelte:head>

<!-- Settings read better in one narrow column than in a two-up grid where
     unequal card heights leave ragged gaps. -->
<div class="max-w-3xl">
	<h1 class="text-2xl font-semibold tracking-tight text-ink">Settings</h1>
	<p class="mt-1 text-sm text-ink-muted">Each section saves on its own.</p>

	{#if form?.error}
		<p
			class="mt-4 rounded-2xl border border-sale/30 bg-sale/8 px-4 py-3 text-sm text-sale"
			role="alert"
		>
			{form.error}
		</p>
	{/if}

	{#snippet section(
		key: string,
		Icon: any,
		title: string,
		description: string,
		body: Snippet,
		colspan = false
	)}
		<form
			method="POST"
			action="?/{key}"
			use:enhance
			class="overflow-hidden rounded-3xl border border-border bg-surface"
		>
			<header class="flex items-start gap-3 border-b border-border px-5 py-4">
				<span
					class="mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary"
				>
					<Icon size={16} />
				</span>
				<div class="min-w-0">
					<h2 class="text-sm font-medium text-ink">{title}</h2>
					<p class="mt-0.5 text-xs text-ink-muted">{description}</p>
				</div>
			</header>

			<div class="px-5 py-5">{@render body()}</div>

			<footer
				class="flex items-center justify-end gap-3 border-t border-border bg-surface-alt px-5 py-3"
			>
				{#if form?.saved === key}
					<span class="flex items-center gap-1.5 text-xs text-success" transition:fade={fadeIn()}>
						<Check size={14} />
						Saved
					</span>
				{/if}
				<Button size="sm" type="submit">Save</Button>
			</footer>
		</form>
	{/snippet}

	<div class="mt-6 flex flex-col gap-4">
		{#snippet storeBody()}
			<div class="flex flex-col gap-4">
				<div class="grid gap-4 sm:grid-cols-2">
					<Input label="Store name" name="name" value={s.store.name} required />
					<Input label="Support phone" name="phone" value={s.store.phone} numeric />
				</div>
				<div class="grid gap-4 sm:grid-cols-2">
					<Input label="Support email" name="email" type="email" value={s.store.email} />
					<Input
						label="Support hours"
						name="supportHours"
						value={s.store.supportHours ?? ''}
						placeholder="Call us 9 AM – 10 PM"
						hint="Shown in the footer."
					/>
				</div>

				<Select
					label="Logo"
					name="logoMode"
					bind:value={logoMode}
					options={[
						{ value: 'text', label: 'Wordmark', hint: 'Your store name, set in Mona Sans' },
						{ value: 'image', label: 'Uploaded image', hint: 'A logo file' }
					]}
				/>

				{#if logoMode === 'text'}
					<Input
						label="Wordmark text"
						name="logoText"
						value={s.store.logo?.text ?? ''}
						placeholder={s.store.name}
						hint="Leave empty to use the store name."
					/>
				{:else}
					<MediaPicker label="Logo image" name="logoImage" bind:value={logoImage} />
				{/if}
			</div>
		{/snippet}
		{@render section('store', Store, 'Store', 'Name, contact details and logo.', storeBody)}

		{#snippet promoBody()}
			<div class="flex flex-col gap-4">
				<div class="grid gap-4 sm:grid-cols-2">
					<Input label="Text" name="text" value={s.promo.text} />
					<Input label="Text (Bangla)" name="textBn" value={s.promo.textBn} />
				</div>
				<div class="grid gap-4 sm:grid-cols-2">
					<Input label="Link" name="href" value={s.promo.href} placeholder="/c/eid-sale" />
					<Select
						label="Background"
						name="background"
						value={s.promo.background ?? 'ink'}
						options={[
							{ value: 'ink', label: 'Dark' },
							{ value: 'brand', label: 'Primary blue' },
							{ value: 'accent', label: 'Bright blue' },
							{ value: 'tint', label: 'Blue tint' },
							{ value: 'sale', label: 'Red' }
						]}
						hint="Pick something other than the header colour so the two read apart."
					/>
				</div>
				<div class="flex flex-wrap gap-x-8 gap-y-3">
					<Checkbox name="active" checked={s.promo.active} label="Show the promo bar" />
					<Checkbox
						name="dismissible"
						checked={s.promo.dismissible}
						label="Shoppers can close it"
					/>
				</div>
			</div>
		{/snippet}
		{@render section(
			'promo',
			Megaphone,
			'Promo bar',
			'The thin strip above the header, on every page.',
			promoBody
		)}

		{#snippet deliveryBody()}
			<!-- One row per zone. Dividers instead of nested cards: three borders
			     inside a bordered card reads as noise. -->
			<div class="flex flex-col">
				{#each zones as z, i (z.key)}
					{@const zone = s.delivery[z.key]}
					<div class="grid gap-4 sm:grid-cols-3 {i > 0 ? 'mt-5 border-t border-border pt-5' : ''}">
						<Input
							label={i === 0 ? 'Zone' : ''}
							name="{z.key}_label"
							value={zone?.label ?? z.fallback}
						/>
						<Input
							label={i === 0 ? 'Charge (৳)' : ''}
							name="{z.key}_charge"
							value={taka(zone?.charge ?? 0)}
							numeric
							inputmode="decimal"
						/>
						<Input
							label={i === 0 ? 'Free above (৳)' : ''}
							name="{z.key}_free"
							value={taka(zone?.freeAbove ?? 0)}
							numeric
							inputmode="decimal"
						/>
					</div>
				{/each}
				<p class="mt-4 text-xs text-ink-muted">
					“Free above” of 0 means delivery is never free for that zone.
				</p>
			</div>
		{/snippet}
		{@render section(
			'delivery',
			Truck,
			'Delivery charges',
			'What each zone costs, and when delivery becomes free.',
			deliveryBody
		)}

		{#snippet paymentBody()}
			<div class="flex flex-col gap-4">
				<div class="flex flex-wrap gap-x-8 gap-y-3">
					<Checkbox name="cod" checked={s.payment.cod} label="Cash on delivery" />
					<Checkbox
						name="sslcommerz"
						checked={s.payment.sslcommerz}
						label="Online payment (SSLCommerz)"
					/>
				</div>
				<Input
					label="COD limit (৳)"
					name="codMaxOrder"
					value={taka(s.payment.codMaxOrder)}
					numeric
					inputmode="decimal"
					hint="Orders above this must be paid online. 0 means no limit."
					class="sm:max-w-64"
				/>
			</div>
		{/snippet}
		{@render section('payment', CreditCard, 'Payment', 'How customers can pay.', paymentBody)}

		{#snippet authBody()}
			<div class="flex flex-col gap-4">
				<Checkbox
					name="otpEnabled"
					bind:checked={otpEnabled}
					label="Sign in with an SMS code"
					hint="Off means customers use a password instead. Existing accounts keep working either way."
				/>
				{#if otpEnabled}
					<div class="grid gap-4 sm:grid-cols-2" transition:fade={fadeIn()}>
						<Input
							label="Code valid for (minutes)"
							name="otpTtlMinutes"
							value={String(s.auth.otpTtlMinutes)}
							type="number"
							min="1"
							max="30"
							numeric
						/>
						<Input
							label="Wrong tries allowed"
							name="maxAttempts"
							value={String(s.auth.maxAttempts)}
							type="number"
							min="3"
							max="10"
							numeric
						/>
					</div>
				{/if}
			</div>
		{/snippet}
		{@render section(
			'auth',
			KeyRound,
			'Customer sign-in',
			'How shoppers get into their account.',
			authBody
		)}

		{#snippet contactBody()}
			<div class="flex flex-col gap-4">
				<div class="grid gap-4 sm:grid-cols-2">
					<Input
						label="WhatsApp number"
						name="whatsapp"
						value={s.contact?.whatsapp ?? ''}
						numeric
						placeholder="01712345678"
						hint="Shown as an “Order on WhatsApp” button on every product."
					/>
					<Input
						label="Messenger username"
						name="messenger"
						value={s.contact?.messenger ?? ''}
						placeholder="yourpage"
						hint="The part after m.me/ — your Page username."
					/>
				</div>
				<Checkbox
					name="callEnabled"
					checked={s.contact?.callEnabled ?? true}
					label="Show a “Call to order” button"
					hint="Uses the support phone above."
				/>
			</div>
		{/snippet}
		{@render section(
			'contact',
			MessageCircle,
			'Order channels',
			'How shoppers can reach you straight from a product page.',
			contactBody
		)}

		{#snippet themeBody()}
			<div class="flex flex-col gap-5">
				<div>
					<span class="mb-2 block text-sm font-medium text-ink">Colour</span>
					<input type="hidden" name="preset" value={preset} />
					<div class="flex flex-wrap gap-2">
						{#each Object.entries(PRESETS) as [key, p] (key)}
							<button
								type="button"
								onclick={() => (preset = key)}
								aria-pressed={preset === key}
								class="flex items-center gap-2.5 rounded-2xl border px-3 py-2 transition-colors duration-[180ms] ease-brand
								       {preset === key ? 'border-primary bg-primary-soft' : 'border-border hover:border-brand-300'}"
							>
								<!-- Three stops, because a single swatch does not show how a
								     palette behaves across a page. -->
								<span class="flex">
									{#each [2, 5, 7] as stop, i (stop)}
										<span
											class="size-5 rounded-full ring-2 ring-surface {i > 0 ? '-ml-2' : ''}"
											style="background: {p.ramp[stop]}"
										></span>
									{/each}
								</span>
								<span class="text-sm text-ink">{p.label}</span>
							</button>
						{/each}
					</div>
				</div>

				<div>
					<span class="mb-2 block text-sm font-medium text-ink">Page background</span>
					<input type="hidden" name="surface" value={surface} />
					<div class="flex flex-wrap gap-2">
						{#each Object.entries(SURFACES) as [key, sf] (key)}
							<button
								type="button"
								onclick={() => (surface = key)}
								aria-pressed={surface === key}
								class="flex items-center gap-2.5 rounded-2xl border px-3 py-2 text-left transition-colors duration-[180ms] ease-brand
								       {surface === key
									? 'border-primary bg-primary-soft'
									: 'border-border hover:border-brand-300'}"
							>
								<span
									class="size-8 shrink-0 rounded-lg border border-border"
									style="background: {sf.page}"
								></span>
								<span>
									<span class="block text-sm text-ink">{sf.label}</span>
									<span class="block text-xs text-ink-muted">{sf.hint}</span>
								</span>
							</button>
						{/each}
					</div>
				</div>

				<p class="text-xs text-ink-muted">
					Every palette here is checked for legibility: buttons, links and their labels stay
					readable whichever you pick.
				</p>
			</div>
		{/snippet}
		{@render section(
			'theme',
			Palette,
			'Theme',
			'The colour of your storefront and this admin.',
			themeBody
		)}

		{#snippet assuranceBody()}
			<div class="flex flex-col gap-4">
				<input type="hidden" name="assurances" value={JSON.stringify(assurances)} />
				<FieldInput field={assuranceField} bind:value={assurances} />
			</div>
		{/snippet}
		{@render section(
			'assurances',
			ShieldCheck,
			'Product page reassurances',
			'The delivery, return and warranty list shown on every product.',
			assuranceBody
		)}

		{#snippet footerBody()}
			<div class="flex flex-col gap-4">
				<input
					type="hidden"
					name="paymentMethods"
					value={JSON.stringify(paymentMethods.map((p) => p.name).filter(Boolean))}
				/>
				<FieldInput field={paymentField} bind:value={paymentMethods} />
				<Input
					label="Footer note"
					name="note"
					value={s.footer?.note ?? ''}
					hint="Small print under the payment badges."
				/>
			</div>
		{/snippet}
		{@render section(
			'footer',
			PanelBottom,
			'Footer',
			'Payment badges and small print.',
			footerBody
		)}

		{#snippet searchBody()}
			<div class="flex flex-col gap-4">
				<input
					type="hidden"
					name="hints"
					value={JSON.stringify(searchHints.map((h) => h.text).filter(Boolean))}
				/>
				<p class="text-xs text-ink-muted">
					These type out one after another in the header search box.
				</p>
				<FieldInput field={hintField} bind:value={searchHints} />
			</div>
		{/snippet}
		{@render section('search', Search, 'Search hints', 'What the search box suggests.', searchBody)}

		{#snippet analyticsBody()}
			<div class="flex flex-col gap-4">
				<Input
					label="Meta Pixel ID"
					name="metaPixelId"
					value={s.analytics?.metaPixelId ?? ''}
					numeric
					placeholder="1234567890"
					hint="From Meta Events Manager. Tracks views, add-to-cart and purchases for your ads."
				/>
				<p class="text-xs text-ink-muted">
					Server-side tracking needs an access token as well, which is a secret — see
					<a href="/admin/connections" class="underline">Connections</a>. Without it the pixel still
					works, but a good share of events are lost to ad blockers.
				</p>
			</div>
		{/snippet}
		{@render section(
			'analytics',
			ChartNoAxesColumn,
			'Facebook ads tracking',
			'Lets Meta see which ads produce orders.',
			analyticsBody
		)}

		{#snippet socialBody()}
			<div class="grid gap-4 sm:grid-cols-3">
				<Input
					label="Facebook"
					name="facebook"
					value={s.social.facebook}
					placeholder="https://facebook.com/…"
				/>
				<Input label="Instagram" name="instagram" value={s.social.instagram} />
				<Input label="YouTube" name="youtube" value={s.social.youtube} />
			</div>
		{/snippet}
		{@render section('social', Share2, 'Social links', 'Shown in the footer.', socialBody)}
	</div>
</div>
