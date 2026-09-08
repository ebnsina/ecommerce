<script lang="ts">
	import {
		ArrowRight,
		Check,
		MessageSquare,
		Banknote,
		Search,
		Truck,
		ChartNoAxesCombined,
		Newspaper,
		Package,
		Megaphone,
		ShieldCheck,
		Sparkle
	} from '@lucide/svelte';
	import { formatTk } from '$lib/money';
	import { reveal } from '$lib/reveal';
	import Button from '$lib/ui/Button.svelte';
	import Img from '$lib/shop/Img.svelte';

	let { data } = $props();

	/* Four facts, not four adjectives. Each one is a thing the shop does that a
	   Bangladeshi owner is actually deciding between platforms over. */
	const facts = [
		{ figure: 'Cash on delivery', note: 'the default, not a fallback' },
		{ figure: '5 channels', note: 'Messenger, Instagram, WhatsApp, Telegram, SMS' },
		{ figure: '2 couriers', note: 'Steadfast and Pathao, dispatched from the order' },
		{ figure: 'One server', note: 'the whole thing, self-hosted' }
	];

	const pillars = [
		{
			Icon: MessageSquare,
			eyebrow: 'One inbox',
			title: 'Orders arrive as messages. Answer them in one place.',
			body: 'Messenger, Instagram, WhatsApp, Telegram, SMS and the website widget land in a single thread list, each one carrying the product the customer was looking at. Replies go back out the way they came in. The assistant can draft the answer, or send it itself for the handful of questions your own settings already answer.',
			panel: 'inbox'
		},
		{
			Icon: Banknote,
			eyebrow: 'Cash on delivery',
			title: 'Built for the way this market actually pays.',
			body: 'Stock is committed when an order is confirmed on the phone, not at checkout. Returns are a real outcome in the pipeline rather than an afterthought, and the refusal rate is reported on its own — because a refused parcel is paid for twice and sold none. Online payment is there when you want it.',
			panel: 'pipeline'
		},
		{
			Icon: Search,
			eyebrow: 'Insights',
			title: 'See what people searched for and never found.',
			body: 'Sales figures cannot tell "nobody wants this" from "nobody can find it". Every search is recorded, and the ones that returned nothing are listed on their own: demand with no product behind it. Alongside them, what shoppers looked at repeatedly and never bought.',
			panel: 'insights'
		}
	];

	const rest = [
		{
			Icon: Package,
			title: 'Catalogue',
			body: 'Variants, bundles, coupons, and a CSV importer that recognises Shopify and WooCommerce exports.'
		},
		{
			Icon: Newspaper,
			title: 'Pages and blog',
			body: 'Every page is built from blocks in the admin. Nothing shopper-facing is written in code.'
		},
		{
			Icon: Truck,
			title: 'Delivery',
			body: 'District and area pickers for all 64 districts, zone-based charges, courier dispatch and status sync.'
		},
		{
			Icon: Megaphone,
			title: 'Ads',
			body: 'Meta, TikTok, Tag Manager and Analytics, plus server-side purchases that ad blockers cannot hide.'
		},
		{
			Icon: Sparkle,
			title: 'Search',
			body: 'Typo-tolerant search that still finds the kettle when someone types "kettel". Falls back to the database.'
		},
		{
			Icon: ShieldCheck,
			title: 'Made to be handed over',
			body: 'Guided tours on the trickiest screens, and every list in the admin behaves the same way.'
		}
	];

	const steps = [
		{
			n: '01',
			title: 'Bring it up',
			body: 'One command with Docker, or a plain Node build anywhere else. Postgres and the search engine come with it.'
		},
		{
			n: '02',
			title: 'Make it yours',
			body: 'Seed the districts and the starter pages, pick a colour, upload a logo, import your catalogue.'
		},
		{
			n: '03',
			title: 'Connect what you use',
			body: 'A courier, a payment gateway, your Facebook page. Each one works alone; none is required to start selling.'
		}
	];

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
			href: '/demo',
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
			href: '/demo/pages/contact',
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
	<title>Store — an online shop the owner runs, not the developer</title>
	<meta
		name="description"
		content="An ecommerce platform built for Bangladesh: cash on delivery, courier dispatch, every message channel in one inbox, and a CMS the shop owner actually operates."
	/>
</svelte:head>

<!-- Hero. The aurora is pure CSS over a dark base — no canvas, and it collapses
     to a flat colour when motion is not wanted. -->
<section class="relative isolate overflow-hidden bg-ink">
	<div class="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
		<span class="aurora a1"></span>
		<span class="aurora a2"></span>
		<span class="aurora a3"></span>
	</div>

	<div class="mx-auto max-w-6xl px-4 pt-20 pb-16 sm:px-6 sm:pt-28">
		<div class="max-w-2xl">
			<p class="text-xs font-semibold tracking-[0.14em] text-white/70 uppercase">
				Ecommerce for Bangladesh
			</p>
			<h1
				class="mt-4 text-4xl font-semibold tracking-tight text-balance text-white sm:text-5xl lg:text-6xl"
			>
				An online shop the owner runs, not the developer.
			</h1>
			<p class="mt-5 max-w-xl text-base text-white/75 sm:text-lg">
				Cash on delivery, courier dispatch, and every message channel in one inbox — with a CMS your
				staff can actually operate. Self-host the whole thing, or let us run it.
			</p>
			<div class="mt-8 flex flex-wrap gap-3">
				<Button href="/demo" size="lg">
					See the live demo
					<ArrowRight size={18} />
				</Button>
				<a
					href="#pricing"
					class="inline-flex h-12 items-center rounded-xl border border-white/25 px-5 text-sm
					       font-medium text-white transition-colors duration-[180ms] ease-brand hover:border-white/50"
				>
					See pricing
				</a>
			</div>
		</div>

		<!-- The shop, as it actually renders. Same cards, same data. -->
		<div class="mt-14 overflow-hidden rounded-3xl border border-white/15 bg-surface" use:reveal>
			<div class="flex items-center gap-2 border-b border-border bg-surface-alt px-4 py-3">
				<span class="flex gap-1.5" aria-hidden="true">
					<span class="size-2.5 rounded-full bg-border"></span>
					<span class="size-2.5 rounded-full bg-border"></span>
					<span class="size-2.5 rounded-full bg-border"></span>
				</span>
				<span class="num ml-2 truncate text-xs text-ink-faint">your-shop.com.bd</span>
			</div>
			<div class="grid grid-cols-2 gap-4 p-4 sm:grid-cols-4 sm:gap-5 sm:p-6">
				{#each data.preview as p (p.id)}
					<article class="flex flex-col gap-2 rounded-2xl border border-border p-3">
						<span class="block aspect-square overflow-hidden rounded-xl bg-surface-alt">
							<Img
								src={p.image}
								width={480}
								height={480}
								sizes="(max-width: 640px) 45vw, 220px"
								class="size-full object-cover"
							/>
						</span>
						<span class="line-clamp-2 text-xs leading-snug font-medium text-ink">{p.title}</span>
						<span class="num text-sm font-semibold text-ink">{formatTk(p.price)}</span>
					</article>
				{/each}
			</div>
		</div>
	</div>
</section>

<!-- Facts band -->
<section class="border-b border-border bg-surface">
	<div class="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
		{#each facts as fact, i (fact.figure)}
			<div use:reveal={{ delay: i * 60 }}>
				<p class="text-lg font-semibold tracking-tight text-ink">{fact.figure}</p>
				<p class="mt-1 text-sm text-ink-muted">{fact.note}</p>
			</div>
		{/each}
	</div>
</section>

<!-- Pillars: one idea per band, each with the interface beside it. -->
<section id="features" class="mx-auto max-w-6xl px-4 py-20 sm:px-6">
	<div class="flex flex-col gap-20 sm:gap-28">
		{#each pillars as pillar, i (pillar.title)}
			<div
				class="grid items-center gap-10 lg:grid-cols-2 lg:gap-16 {i % 2 === 1
					? '[&>*:first-child]:lg:order-2'
					: ''}"
				use:reveal
			>
				<div>
					<p
						class="flex items-center gap-2 text-xs font-semibold tracking-[0.12em] text-primary uppercase"
					>
						<pillar.Icon size={15} />
						{pillar.eyebrow}
					</p>
					<h2 class="mt-3 text-2xl font-semibold tracking-tight text-balance text-ink sm:text-3xl">
						{pillar.title}
					</h2>
					<p class="mt-4 text-base text-ink-muted">{pillar.body}</p>
				</div>

				<div class="rounded-3xl border border-border bg-surface p-5 sm:p-6">
					{#if pillar.panel === 'inbox'}
						<ul class="flex flex-col gap-3">
							{#each [{ who: 'Nusrat', ch: 'WhatsApp', msg: 'Eta ki original? Koto din warranty?', about: 'Gazi Electric Kettle 1.8L' }, { who: 'Tanvir', ch: 'Messenger', msg: 'Chattogram e delivery charge koto?', about: 'Havit Bluetooth Speaker' }, { who: 'Sadia', ch: 'Instagram', msg: 'Ei size ta ache?', about: 'Winner Kids Frock' }] as t (t.who)}
								<li class="rounded-2xl border border-border p-3.5">
									<p class="flex items-center gap-2 text-xs text-ink-muted">
										<span class="font-medium text-ink">{t.who}</span>
										<span class="rounded-lg bg-track px-1.5 py-0.5">{t.ch}</span>
									</p>
									<p class="mt-1.5 text-sm text-ink">{t.msg}</p>
									<p class="mt-1 truncate text-xs text-ink-faint">about {t.about}</p>
								</li>
							{/each}
						</ul>
					{:else if pillar.panel === 'pipeline'}
						<ol class="flex flex-col">
							{#each [{ s: 'Placed', d: 'Order 260908-0042 · ৳2,499', on: true }, { s: 'Confirmed on the phone', d: 'Stock committed now, not at checkout', on: true }, { s: 'Packed', d: 'Invoice printed', on: true }, { s: 'Sent with Steadfast', d: 'Consignment 91442008', on: true }, { s: 'Delivered — cash collected', d: 'Marked paid by the courier sync', on: false }] as step (step.s)}
								<li class="flex gap-3 border-b border-border py-3 last:border-0">
									<span
										class="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full
										       {step.on ? 'bg-primary text-white' : 'border border-border text-ink-faint'}"
									>
										{#if step.on}<Check size={12} />{/if}
									</span>
									<span class="min-w-0">
										<span class="block text-sm font-medium text-ink">{step.s}</span>
										<span class="num block text-xs text-ink-muted">{step.d}</span>
									</span>
								</li>
							{/each}
						</ol>
					{:else}
						<p
							class="flex items-center gap-2 text-xs font-semibold tracking-wide text-ink uppercase"
						>
							<ChartNoAxesCombined size={14} class="text-sale" />
							Searched for, and we had nothing
						</p>
						<ul class="mt-3 flex flex-col">
							{#each [['washing machine', 31], ['ac 1.5 ton', 24], ['iphone 15 pro', 18], ['sewing machine', 9]] as [term, n] (term)}
								<li
									class="flex items-center justify-between gap-3 border-b border-border py-2.5 last:border-0"
								>
									<span class="truncate text-sm text-ink">{term}</span>
									<span class="num shrink-0 text-sm text-ink-muted">{n}</span>
								</li>
							{/each}
						</ul>
						<p class="mt-4 text-xs text-ink-muted">
							Every one of these is a shopper who wanted to spend money and could not.
						</p>
					{/if}
				</div>
			</div>
		{/each}
	</div>
</section>

<!-- Everything else -->
<section class="border-y border-border bg-surface-alt">
	<div class="mx-auto max-w-6xl px-4 py-20 sm:px-6">
		<h2 class="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">And the rest of it</h2>
		<div class="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
			{#each rest as item, i (item.title)}
				<div use:reveal={{ delay: Math.min(i, 3) * 60 }}>
					<p class="flex items-center gap-2 text-sm font-medium text-ink">
						<item.Icon size={16} class="text-primary" />
						{item.title}
					</p>
					<p class="mt-1.5 text-sm text-ink-muted">{item.body}</p>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- How it works -->
<section class="mx-auto max-w-6xl px-4 py-20 sm:px-6">
	<h2 class="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Getting started</h2>
	<div class="mt-10 grid gap-8 sm:grid-cols-3">
		{#each steps as step, i (step.n)}
			<div use:reveal={{ delay: i * 80 }}>
				<p class="num text-sm font-semibold text-primary">{step.n}</p>
				<p class="mt-2 text-base font-medium text-ink">{step.title}</p>
				<p class="mt-1.5 text-sm text-ink-muted">{step.body}</p>
			</div>
		{/each}
	</div>
</section>

<!-- Pricing -->
<section id="pricing" class="border-t border-border bg-surface">
	<div class="mx-auto max-w-6xl px-4 py-20 sm:px-6">
		<div class="max-w-2xl">
			<h2 class="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
				You pay for a server being run for you
			</h2>
			<p class="mt-3 text-base text-ink-muted">
				Not for features being unlocked. Every plan is the same software; the difference is who
				keeps it running.
			</p>
		</div>

		<div class="mt-10 grid gap-5 lg:grid-cols-3">
			{#each tiers as tier, i (tier.name)}
				<div
					class="flex flex-col rounded-3xl border p-6 {tier.recommended
						? 'border-primary-accent'
						: 'border-border'}"
					use:reveal={{ delay: i * 70 }}
				>
					<div class="flex items-center justify-between gap-2">
						<h3 class="text-sm font-semibold tracking-wide text-ink uppercase">{tier.name}</h3>
						{#if tier.recommended}
							<span class="rounded-lg bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary">
								Recommended
							</span>
						{/if}
					</div>
					<p class="mt-4 flex items-baseline gap-1.5">
						<span class="num text-3xl font-semibold tracking-tight text-ink">{tier.price}</span>
						<span class="text-sm text-ink-muted">{tier.period}</span>
					</p>
					<p class="mt-3 text-sm text-ink-muted">{tier.blurb}</p>
					<ul class="mt-5 flex flex-1 flex-col gap-2.5">
						{#each tier.points as point (point)}
							<li class="flex gap-2.5 text-sm text-ink">
								<Check size={16} class="mt-0.5 shrink-0 text-primary-accent" />
								{point}
							</li>
						{/each}
					</ul>
					<div class="mt-6">
						<Button
							href={tier.href}
							variant={tier.recommended ? 'primary' : 'secondary'}
							class="w-full"
						>
							{tier.cta}
						</Button>
					</div>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- Questions -->
<section id="faq" class="border-t border-border">
	<div class="mx-auto max-w-3xl px-4 py-20 sm:px-6">
		<h2 class="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Questions</h2>
		<div class="mt-8 flex flex-col">
			{#each faqs as faq (faq.q)}
				<details class="group border-b border-border py-4">
					<summary
						class="flex cursor-pointer items-center justify-between gap-4 rounded-lg text-sm font-medium text-ink marker:content-['']"
					>
						{faq.q}
						<span
							class="grid size-6 shrink-0 place-items-center rounded-lg border border-border text-ink-muted
							       transition-transform duration-[180ms] ease-brand group-open:rotate-45 motion-reduce:transition-none"
							aria-hidden="true"
						>
							+
						</span>
					</summary>
					<p class="mt-3 text-sm text-ink-muted">{faq.a}</p>
				</details>
			{/each}
		</div>
	</div>
</section>

<!-- Close -->
<section class="border-t border-border bg-surface-alt">
	<div class="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-20 sm:px-6">
		<h2 class="max-w-xl text-2xl font-semibold tracking-tight text-balance text-ink sm:text-3xl">
			The fastest way to judge it is to use it.
		</h2>
		<div class="flex flex-wrap gap-3">
			<Button href="/demo" size="lg">
				Open the demo shop
				<ArrowRight size={18} />
			</Button>
			<Button href="#pricing" variant="secondary" size="lg">Compare the plans</Button>
		</div>
	</div>
</section>
