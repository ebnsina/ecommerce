<script lang="ts">
	import {
		ArrowRight,
		BadgeCheck,
		Banknote,
		Bot,
		Boxes,
		ChartNoAxesCombined,
		ChevronDown,
		Inbox,
		LayoutTemplate,
		Megaphone,
		PackageCheck,
		Search,
		Truck,
		Users
	} from '@lucide/svelte';
	import Button from '$lib/ui/Button.svelte';
	import { formatTk } from '$lib/money';

	const featureGroups = [
		{
			icon: LayoutTemplate,
			title: 'Every page built from blocks',
			points: [
				'A block-based editor for the homepage, category pages and policy pages, with draft and publish.',
				'Menu builder, media library with search, and seven colour themes applied without a rebuild.',
				'A blog with covers, summaries, tags and drafts — a draft is readable by you and nobody else.',
				'Nothing a shopper reads is written in code. It is all in the CMS.'
			]
		},
		{
			icon: Boxes,
			title: 'Catalogue that matches how you sell',
			points: [
				'Products with up to two option axes — size and colour — and stock per variant.',
				'Bundles sold as a set for one price, showing the saving, added and removed as a group.',
				'Categories, coupons, reviews held for moderation, and questions published once answered.',
				'CSV import and export, with presets that read Shopify and WooCommerce exports.'
			]
		},
		{
			icon: Banknote,
			title: 'Cash on delivery, and online when you want it',
			points: [
				'Cash on delivery is the default and needs no account.',
				'Cards, bKash, Nagad, Rocket and internet banking through SSLCommerz once the keys are in.',
				'If the gateway cannot be reached the order is still placed — it sits unpaid for someone to call about.',
				'District and area selector covering all 64 districts, with delivery charge derived from the place chosen.'
			]
		},
		{
			icon: Truck,
			title: 'Parcels handed to the courier from the order',
			points: [
				'Dispatch to Steadfast or Pathao without retyping the address.',
				'The consignment and tracking code are stored, the order moves to shipped, the customer is texted.',
				'A scheduled job refreshes courier status and marks a delivered cash-on-delivery parcel as paid.',
				'Returns are a first-class outcome in the pipeline, not an afterthought.'
			]
		},
		{
			icon: Inbox,
			title: 'One inbox for every channel',
			points: [
				'Messenger, Instagram, WhatsApp, Telegram, SMS and your own website chat in one list.',
				'Each thread carries the product the customer was looking at, picked up from the referral or the link.',
				'An assistant drafts the reply; a person checks it and sends it.',
				'It can answer the easy questions alone — delivery charge, delivery time, payment, returns, opening hours — and never anything about a particular order, price or refund.'
			]
		},
		{
			icon: Search,
			title: 'Search that forgives spelling',
			points: [
				'With Typesense connected, "kettel" finds the kettle and "washing mashine" finds the washing machine.',
				'It is optional — without it the shop searches the database as before, matching what is typed.',
				'Filters for category, price, rating, brand, stock and offers, all held in the web address.',
				'A filtered view is a link you can send, and the filtering happens in the database.'
			]
		},
		{
			icon: ChartNoAxesCombined,
			title: 'Numbers that name the lost sale',
			points: [
				'What shoppers searched for and found nothing — demand you have no product for.',
				'What they looked at and never bought.',
				'How orders end, with the cash-on-delivery refusal rate called out.',
				'A refused parcel is paid for twice and sold none, so it is counted as its own number.'
			]
		},
		{
			icon: Megaphone,
			title: 'Following up and getting counted',
			points: [
				'Abandoned carts appear with their value once a phone number is typed, and one text reopens the cart on any device.',
				'Meta Pixel, TikTok Pixel, Google Tag Manager and Google Analytics — fill in the ones you use.',
				'Meta purchases are also sent from the server, under a shared event ID so nothing is counted twice.',
				'Sitemap, product feed for Facebook and Google, and structured data on product pages.'
			]
		},
		{
			icon: Users,
			title: 'Built for staff who are not developers',
			points: [
				'Guided tours walk through the page builder, the pages list and the menus the first time they are opened.',
				'Every list works the same way: search and filters above, an action menu per row, paging below.',
				'Sign-in by phone number with an SMS code, switchable to a password from the CMS.',
				'A Integrations screen says what is set up, what each thing is for, and what is still missing.'
			]
		}
	];

	const steps = [
		{
			title: 'Install it',
			body: 'Three containers with Docker Compose, or `pnpm build` for a plain Node server that runs anywhere Node runs. No hosting provider is baked in.'
		},
		{
			title: 'Seed and set it up',
			body: 'The seed creates the tables, a demo catalogue, pages, and all 64 districts with their areas. Then the shop owner changes the rest in the CMS.'
		},
		{
			title: 'Connect what you use',
			body: 'Courier, payment gateway, SMS, search, storage, ad platforms. The Integrations screen names the exact variables each one needs.'
		},
		{
			title: 'Take orders',
			body: 'Messages land in one inbox, orders move through the pipeline, parcels go to the courier, and two scheduled jobs keep statuses and reminders in step.'
		}
	];

	const integrations = [
		{ name: 'SSLCommerz', what: 'Cards, bKash, Nagad, Rocket, banking' },
		{ name: 'Steadfast', what: 'Courier dispatch and status' },
		{ name: 'Pathao', what: 'Courier dispatch and status' },
		{ name: 'Typesense', what: 'Typo-tolerant search' },
		{ name: 'Meta Pixel', what: 'Facebook and Instagram ads' },
		{ name: 'Meta Conversions API', what: 'Server-side purchases' },
		{ name: 'TikTok Pixel', what: 'TikTok ads' },
		{ name: 'Google Tag Manager', what: 'Your own tags, on a data layer' },
		{ name: 'Google Analytics', what: 'Traffic and ecommerce reports' },
		{ name: 'Messenger', what: 'Threads in the Inbox' },
		{ name: 'Instagram', what: 'Threads in the Inbox' },
		{ name: 'WhatsApp', what: 'Threads in the Inbox' },
		{ name: 'Telegram', what: 'Threads in the Inbox' },
		{ name: 'SMS gateway', what: 'Sign-in codes and order notices' },
		{ name: 'S3-compatible storage', what: 'Where product images live' },
		{ name: 'Anthropic, OpenAI, Groq or Ollama', what: 'The reply assistant' }
	];

	/* Money is integer poisha everywhere, including here. */
	const tiers = [
		{
			name: 'Self-hosted',
			price: formatTk(0),
			period: 'forever',
			blurb: 'The whole platform, on your own server. Nothing is held back.',
			points: [
				'Every feature on this page',
				'Docker Compose or a plain Node build',
				'You run the database, backups and TLS',
				'Community support'
			],
			cta: 'Read the setup guide',
			href: '#faq',
			recommended: false
		},
		{
			name: 'Managed',
			price: formatTk(350000),
			period: 'per month',
			blurb: 'We run the server, the database and the search engine. You run the shop.',
			points: [
				'Hosting, daily backups and TLS on your domain',
				'Typesense and image storage included',
				'Upgrades applied for you',
				'Support by phone and WhatsApp during business hours'
			],
			cta: 'See the demo',
			href: '/',
			recommended: true
		},
		{
			name: 'Custom',
			price: `From ${formatTk(1200000)}`,
			period: 'per month',
			blurb: 'For shops with their own warehouse system, ERP or several outlets.',
			points: [
				'Everything in Managed',
				'Bespoke integrations and imports',
				'Staff training and data migration',
				'A named contact and an agreed response time'
			],
			cta: 'Talk to us',
			href: '/pages/contact',
			recommended: false
		}
	];

	const faqs = [
		{
			q: 'Can I run it myself?',
			a: 'Yes. The whole platform is open to self-host. Docker Compose brings up the app, Postgres and Typesense in one command, and `pnpm build` produces a plain Node server for anywhere else. Nothing is reserved for a paid plan.'
		},
		{
			q: 'What happens if I connect nothing?',
			a: 'The shop runs on a database alone. Search matches what is typed exactly, uploads go to local disk, SMS codes are written to the server log, and consignments are entered by hand. Each connection improves one of those; none of them is required to sell.'
		},
		{
			q: 'Is cash on delivery properly supported?',
			a: 'It is the default, not a fallback. Stock is committed when an order is confirmed rather than at checkout, returns are a first-class outcome in the pipeline, and the refusal rate is reported on its own in Insights. A delivered cash parcel is marked paid by the courier sync.'
		},
		{
			q: 'Does the assistant reply to customers on its own?',
			a: 'Only if you switch it on, per channel, with a confidence bar you set. It answers delivery charges, delivery times, payment methods, returns and opening hours — things your own settings answer. Anything about a particular order, price, refund or complaint is left for a person. It never replies to a thread a colleague has picked up, and every automatic reply is marked as the assistant.'
		},
		{
			q: 'Do my staff need training?',
			a: 'The page builder, the pages list and the menus screen walk through themselves the first time they are opened, and a "Show me how" button brings the walkthrough back later. Every list in the admin behaves the same way, so learning one teaches the rest.'
		},
		{
			q: 'Can I bring a catalogue from Shopify or WooCommerce?',
			a: 'Yes. The importer takes a CSV, detects the Shopify or WooCommerce format, and says which one it found. Products export back to CSV the same way.'
		}
	];
</script>

<svelte:head>
	<title>Store — an ecommerce platform for Bangladeshi shops</title>
	<meta
		name="description"
		content="Cash on delivery, couriers, one inbox for Messenger and WhatsApp, and a CMS the shop owner runs without a developer."
	/>
</svelte:head>

<!-- Hero -->
<section class="border-b border-border">
	<div class="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
		<p class="text-sm font-medium tracking-tight text-primary">Built for Bangladesh</p>
		<h1 class="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
			An online shop the owner runs, not the developer.
		</h1>
		<p class="mt-5 max-w-2xl text-base leading-relaxed text-ink-muted sm:text-lg">
			Cash on delivery, courier dispatch, and every message from Messenger, WhatsApp and Instagram
			in one inbox — with every page, price and word changed from the admin.
		</p>
		<div class="mt-9 flex flex-wrap gap-3">
			<Button href="/" size="lg">
				See the demo
				<ArrowRight class="size-4" aria-hidden="true" />
			</Button>
			<Button href="#features" size="lg" variant="secondary">Read the docs</Button>
		</div>
	</div>
</section>

<!-- Problem -->
<section class="border-b border-border bg-surface-alt" aria-labelledby="problem-heading">
	<div class="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
		<h2 id="problem-heading" class="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
			What it is for
		</h2>
		<p class="mt-4 max-w-2xl leading-relaxed text-ink-muted">
			Most shops here sell the same way. These are the parts that hurt.
		</p>
		<div class="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
			{#each [{ title: 'Orders arrive as messages', body: 'A price question on Messenger, an address on WhatsApp, a confirmation by phone. Nobody knows which thread became an order.' }, { title: 'Parcels come back', body: 'A refused cash-on-delivery parcel is paid for twice and sold none. Nothing in a sales report tells you how often it happens.' }, { title: 'The developer is the bottleneck', body: 'Changing a banner, a delivery charge or a policy page means finding someone who can edit code.' }, { title: 'Staff are not technical', body: 'The people using the admin all day sell things. They should not need a manual to publish a page.' }] as item (item.title)}
				<article class="rounded-3xl border border-border bg-surface p-6">
					<h3 class="text-base font-semibold tracking-tight text-ink">{item.title}</h3>
					<p class="mt-2 text-sm leading-relaxed text-ink-muted">{item.body}</p>
				</article>
			{/each}
		</div>
	</div>
</section>

<!-- Features -->
<section
	id="features"
	class="scroll-mt-20 border-b border-border"
	aria-labelledby="features-heading"
>
	<div class="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
		<h2 id="features-heading" class="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
			What it does
		</h2>
		<p class="mt-4 max-w-2xl leading-relaxed text-ink-muted">
			Everything below is in the product today. Anything optional says so.
		</p>
		<div class="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each featureGroups as group (group.title)}
				<article class="rounded-3xl border border-border bg-surface p-6">
					<group.icon class="size-5 text-primary-accent" aria-hidden="true" />
					<h3 class="mt-4 text-base font-semibold tracking-tight text-ink">{group.title}</h3>
					<ul class="mt-3 space-y-2 text-sm leading-relaxed text-ink-muted">
						{#each group.points as point (point)}
							<li class="flex gap-2.5">
								<BadgeCheck class="mt-0.5 size-4 shrink-0 text-primary-accent" aria-hidden="true" />
								<span>{point}</span>
							</li>
						{/each}
					</ul>
				</article>
			{/each}
		</div>
	</div>
</section>

<!-- How it works -->
<section class="border-b border-border bg-surface-alt" aria-labelledby="how-heading">
	<div class="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
		<h2 id="how-heading" class="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
			How it works
		</h2>
		<ol class="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
			{#each steps as step, i (step.title)}
				<li class="rounded-3xl border border-border bg-surface p-6">
					<span class="num text-sm font-medium text-ink-muted">
						{String(i + 1).padStart(2, '0')}
					</span>
					<h3 class="mt-3 text-base font-semibold tracking-tight text-ink">{step.title}</h3>
					<p class="mt-2 text-sm leading-relaxed text-ink-muted">{step.body}</p>
				</li>
			{/each}
		</ol>
	</div>
</section>

<!-- Integrations -->
<section class="border-b border-border" aria-labelledby="integrations-heading">
	<div class="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
		<h2
			id="integrations-heading"
			class="text-2xl font-semibold tracking-tight text-ink sm:text-3xl"
		>
			What it connects to
		</h2>
		<p class="mt-4 max-w-2xl leading-relaxed text-ink-muted">
			Each one is optional and degrades cleanly when absent. The admin lists what is set up and the
			exact variables anything missing needs.
		</p>
		<ul class="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
			{#each integrations as item (item.name)}
				<li class="rounded-2xl border border-border bg-surface p-4">
					<p class="text-sm font-medium tracking-tight text-ink">{item.name}</p>
					<p class="mt-1 text-sm text-ink-muted">{item.what}</p>
				</li>
			{/each}
		</ul>
	</div>
</section>

<!-- Pricing -->
<section
	id="pricing"
	class="scroll-mt-20 border-b border-border bg-surface-alt"
	aria-labelledby="pricing-heading"
>
	<div class="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
		<h2 id="pricing-heading" class="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
			Pricing
		</h2>
		<p class="mt-4 max-w-2xl leading-relaxed text-ink-muted">
			The platform is open to self-host. You pay for the server being run for you, not for features
			being unlocked.
		</p>
		<div class="mt-10 grid gap-4 lg:grid-cols-3">
			{#each tiers as tier (tier.name)}
				<article
					class="flex flex-col rounded-3xl border bg-surface p-6 {tier.recommended
						? 'border-primary-accent'
						: 'border-border'}"
				>
					<div class="flex items-center gap-2">
						<h3 class="text-base font-semibold tracking-tight text-ink">{tier.name}</h3>
						{#if tier.recommended}
							<span
								class="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-0.5 text-xs font-medium text-ink"
							>
								<PackageCheck class="size-3.5 text-primary-accent" aria-hidden="true" />
								Recommended
							</span>
						{/if}
					</div>
					<p class="mt-2 text-sm leading-relaxed text-ink-muted">{tier.blurb}</p>
					<p class="mt-6 flex items-baseline gap-2">
						<span class="num text-3xl font-semibold tracking-tight text-ink">{tier.price}</span>
						<span class="text-sm text-ink-muted">{tier.period}</span>
					</p>
					<ul class="mt-6 flex-1 space-y-2 text-sm leading-relaxed text-ink-muted">
						{#each tier.points as point (point)}
							<li class="flex gap-2.5">
								<BadgeCheck class="mt-0.5 size-4 shrink-0 text-primary-accent" aria-hidden="true" />
								<span>{point}</span>
							</li>
						{/each}
					</ul>
					<div class="mt-8">
						<Button
							href={tier.href}
							block
							variant={tier.recommended ? 'primary' : 'secondary'}
							aria-label="{tier.cta} — {tier.name} plan"
						>
							{tier.cta}
						</Button>
					</div>
				</article>
			{/each}
		</div>
	</div>
</section>

<!-- FAQ -->
<section id="faq" class="scroll-mt-20 border-b border-border" aria-labelledby="faq-heading">
	<div class="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
		<h2 id="faq-heading" class="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
			Questions
		</h2>
		<div class="mt-10 space-y-3">
			{#each faqs as faq (faq.q)}
				<details class="group rounded-2xl border border-border bg-surface p-5">
					<summary
						class="flex cursor-pointer items-start justify-between gap-4 rounded-lg text-base font-medium tracking-tight text-ink"
					>
						{faq.q}
						<ChevronDown
							class="mt-0.5 size-4 shrink-0 text-primary-accent transition-transform duration-[180ms] ease-brand group-open:rotate-180"
							aria-hidden="true"
						/>
					</summary>
					<p class="mt-3 text-sm leading-relaxed text-ink-muted">{faq.a}</p>
				</details>
			{/each}
		</div>
	</div>
</section>

<!-- Final CTA -->
<section aria-labelledby="cta-heading">
	<div class="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
		<div class="rounded-3xl border border-border bg-surface p-8 sm:p-12">
			<Bot class="size-6 text-primary-accent" aria-hidden="true" />
			<h2 id="cta-heading" class="mt-5 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
				Open the demo shop and place an order.
			</h2>
			<p class="mt-4 max-w-2xl leading-relaxed text-ink-muted">
				It is the real thing, seeded with a catalogue, pages and every district. Nothing on this
				page is behind a sales call.
			</p>
			<div class="mt-8 flex flex-wrap gap-3">
				<Button href="/" size="lg">
					See the demo
					<ArrowRight class="size-4" aria-hidden="true" />
				</Button>
				<Button href="#pricing" size="lg" variant="secondary">Compare the plans</Button>
			</div>
		</div>
	</div>
</section>
