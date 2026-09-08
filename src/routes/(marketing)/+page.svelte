<script lang="ts">
	import { ArrowRight, Check, MessageSquare, Banknote, Search } from '@lucide/svelte';
	import { formatTk } from '$lib/money';
	import { reveal } from '$lib/reveal';
	import Img from '$lib/shop/Img.svelte';

	let { data } = $props();

	const facts = [
		{ figure: 'Cash on delivery', note: 'the default, not a fallback' },
		{ figure: '5 channels', note: 'Messenger, Instagram, WhatsApp, Telegram, SMS' },
		{ figure: '2 couriers', note: 'Steadfast and Pathao' },
		{ figure: 'One server', note: 'the whole thing, self-hosted' }
	];

	const pillars = [
		{
			Icon: MessageSquare,
			eyebrow: 'One inbox',
			title: 'Orders arrive as messages',
			body: 'Messenger, Instagram, WhatsApp, Telegram, SMS and the website widget land in one thread list, each carrying the product the customer was looking at. Replies go back out the way they came in.',
			panel: 'inbox'
		},
		{
			Icon: Banknote,
			eyebrow: 'Cash on delivery',
			title: 'Built for how this market pays',
			body: 'Stock is committed when an order is confirmed on the phone, not at checkout. Returns are a real outcome in the pipeline, and the refusal rate is reported on its own — a refused parcel is paid for twice and sold none.',
			panel: 'pipeline'
		},
		{
			Icon: Search,
			eyebrow: 'Insights',
			title: 'See what nobody could find',
			body: 'Sales figures cannot tell “nobody wants this” from “nobody can find it”. Searches that returned nothing are listed on their own: demand with no product behind it.',
			panel: 'insights'
		}
	];

	const rest = [
		[
			'Catalogue',
			'Variants, bundles, coupons, and a CSV importer that knows Shopify and WooCommerce.'
		],
		[
			'Pages and blog',
			'Every page is built from blocks. Nothing shopper-facing is written in code.'
		],
		['Delivery', 'All 64 districts, zone charges, courier dispatch and status sync.'],
		['Ads', 'Meta, TikTok, Tag Manager, Analytics — plus purchases sent server-side.'],
		['Search', 'Finds the kettle when someone types “kettel”. Falls back to the database.'],
		['Handover', 'Guided tours on the hardest screens; every admin list behaves the same.']
	];

	const steps = [
		['Bring it up', 'One command with Docker, or a plain Node build anywhere else.'],
		['Make it yours', 'Districts, starter pages, a colour, a logo, your catalogue.'],
		['Connect what you use', 'A courier, a gateway, your Facebook page. None is required to start.']
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
	<title>CommerceBD — an online shop the owner runs, not the developer</title>
	<meta
		name="description"
		content="CommerceBD — ecommerce for Bangladesh: cash on delivery, courier dispatch, every message channel in one inbox, and a CMS the shop owner operates."
	/>
</svelte:head>

<!-- Hero: full-bleed sunset band. The nav above it is transparent, so the two
     read as one surface until the page scrolls. -->
<section class="relative -mt-16 pt-16" style="background: var(--m-hero)">
	<div class="mx-auto max-w-[1200px] px-4 pt-20 pb-32 text-center sm:px-6 sm:pt-28">
		<p class="eyebrow" style="color: var(--m-ink)">Ecommerce for Bangladesh</p>

		<h1
			class="display mx-auto mt-5 max-w-[800px] text-[2.75rem] text-balance sm:text-[3.5rem] lg:text-[5rem]"
		>
			An online shop the owner runs.
		</h1>

		<p class="mx-auto mt-6 max-w-xl text-lg sm:text-xl" style="color: var(--m-ink-2)">
			Cash on delivery, courier dispatch, and every message channel in one inbox — with a CMS your
			staff can actually operate.
		</p>

		<div class="mt-9 flex flex-wrap justify-center gap-3">
			<a href="/demo" class="m-btn m-btn-primary">
				See the live demo
				<ArrowRight size={18} />
			</a>
			<a href="#pricing" class="m-btn m-btn-ghost">Is this for me?</a>
		</div>

		<!-- Marker annotation: the only handmade element, and only over the
		     gradient where it has the contrast to be read. -->
		<p
			class="marker mt-10 text-lg sm:text-xl"
			style="color: var(--m-pink); transform: rotate(-2deg)"
		>
			↓ this is the real shop, not a screenshot
		</p>
	</div>
</section>

<!-- Showcase row, lifted up into the gradient. Real products, rendered from the
     same data the demo sells. -->
<section class="mx-auto -mt-24 max-w-[1200px] px-4 sm:px-6">
	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
		{#each data.preview as p, i (p.id)}
			<article class="m-card overflow-hidden" use:reveal={{ delay: i * 60 }}>
				<span class="block aspect-square overflow-hidden" style="background: var(--m-wash)">
					<Img
						src={p.image}
						width={480}
						height={480}
						sizes="(max-width: 640px) 45vw, 260px"
						class="size-full object-cover"
					/>
				</span>
				<div class="p-5">
					<p class="line-clamp-2 text-sm leading-snug font-medium">{p.title}</p>
					<p class="mt-2 text-base font-semibold">{formatTk(p.price)}</p>
				</div>
			</article>
		{/each}
	</div>
</section>

<!-- Facts -->
<section class="mx-auto max-w-[1200px] px-4 py-20 sm:px-6">
	<div class="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
		{#each facts as fact, i (fact.figure)}
			<div use:reveal={{ delay: i * 60 }}>
				<p class="text-lg font-semibold">{fact.figure}</p>
				<p class="mt-1 text-sm" style="color: var(--m-ink-2)">{fact.note}</p>
			</div>
		{/each}
	</div>
</section>

<!-- Pillars -->
<section id="features" class="mx-auto max-w-[1200px] px-4 pb-20 sm:px-6">
	<div class="flex flex-col gap-20">
		{#each pillars as pillar, i (pillar.title)}
			<div
				class="grid items-center gap-10 lg:grid-cols-2 lg:gap-16 {i % 2 === 1
					? '[&>*:first-child]:lg:order-2'
					: ''}"
				use:reveal
			>
				<div>
					<p class="eyebrow flex items-center gap-2">
						<pillar.Icon size={15} />
						{pillar.eyebrow}
					</p>
					<h2 class="display mt-3 text-[2rem] text-balance sm:text-[2.5rem]">{pillar.title}</h2>
					<p class="mt-4 text-base" style="color: var(--m-ink-2)">{pillar.body}</p>
				</div>

				<div class="m-card p-6">
					{#if pillar.panel === 'inbox'}
						<ul class="flex flex-col gap-3">
							{#each [{ who: 'Nusrat', ch: 'WhatsApp', msg: 'Eta ki original? Koto din warranty?', about: 'Gazi Electric Kettle 1.8L' }, { who: 'Tanvir', ch: 'Messenger', msg: 'Chattogram e delivery charge koto?', about: 'Havit Bluetooth Speaker' }, { who: 'Sadia', ch: 'Instagram', msg: 'Ei size ta ache?', about: 'Winner Kids Frock' }] as t (t.who)}
								<li class="rounded-md p-3.5" style="border: 1px solid var(--m-hairline)">
									<p class="flex items-center gap-2 text-xs" style="color: var(--m-ink-2)">
										<span class="font-semibold" style="color: var(--m-ink)">{t.who}</span>
										<span class="m-pill">{t.ch}</span>
									</p>
									<p class="mt-2 text-sm">{t.msg}</p>
									<p class="mt-1 truncate text-xs" style="color: var(--m-ink-2)">about {t.about}</p>
								</li>
							{/each}
						</ul>
					{:else if pillar.panel === 'pipeline'}
						<ol class="flex flex-col">
							{#each [['Placed', 'Order 260908-0042 · ৳2,499', true], ['Confirmed on the phone', 'Stock committed now, not at checkout', true], ['Packed', 'Invoice printed', true], ['Sent with Steadfast', 'Consignment 91442008', true], ['Delivered — cash collected', 'Marked paid by the courier sync', false]] as [label, detail, done] (label)}
								<li
									class="flex gap-3 py-3 last:pb-0"
									style="border-bottom: 1px solid var(--m-hairline)"
								>
									<span
										class="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold"
										style={done
											? 'background: var(--m-ink); color: #fff'
											: 'border: 1px solid var(--m-hairline); color: var(--m-ink-2)'}
									>
										{#if done}<Check size={13} />{/if}
									</span>
									<span class="min-w-0">
										<span class="block text-sm font-medium">{label}</span>
										<span class="block text-xs" style="color: var(--m-ink-2)">{detail}</span>
									</span>
								</li>
							{/each}
						</ol>
					{:else}
						<p class="eyebrow">Searched for, and we had nothing</p>
						<ul class="mt-4 flex flex-col">
							{#each [['washing machine', 31], ['ac 1.5 ton', 24], ['iphone 15 pro', 18], ['sewing machine', 9]] as [term, n] (term)}
								<li
									class="flex items-center justify-between gap-3 py-2.5"
									style="border-bottom: 1px solid var(--m-hairline)"
								>
									<span class="truncate text-sm">{term}</span>
									<span class="text-sm font-semibold">{n}</span>
								</li>
							{/each}
						</ul>
						<p class="mt-4 text-xs" style="color: var(--m-ink-2)">
							Every one is a shopper who wanted to spend money and could not.
						</p>
					{/if}
				</div>
			</div>
		{/each}
	</div>
</section>

<!-- Everything else -->
<section class="mx-auto max-w-[1200px] px-4 pb-20 sm:px-6">
	<p class="eyebrow">And the rest of it</p>
	<div class="mt-8 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
		{#each rest as [title, body], i (title)}
			<div use:reveal={{ delay: Math.min(i, 3) * 60 }}>
				<p class="text-sm font-semibold">{title}</p>
				<p class="mt-1.5 text-sm" style="color: var(--m-ink-2)">{body}</p>
			</div>
		{/each}
	</div>
</section>

<!-- Steps -->
<section class="mx-auto max-w-[1200px] px-4 pb-20 sm:px-6">
	<p class="eyebrow">Getting started</p>
	<div class="mt-8 grid gap-8 sm:grid-cols-3">
		{#each steps as [title, body], i (title)}
			<div class="flex gap-3" use:reveal={{ delay: i * 70 }}>
				<span
					class="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-xs font-semibold"
					style="background: var(--m-ink); color: #fff"
				>
					{i + 1}
				</span>
				<span>
					<span class="block text-base font-medium">{title}</span>
					<span class="mt-1 block text-sm" style="color: var(--m-ink-2)">{body}</span>
				</span>
			</div>
		{/each}
	</div>
</section>

<!-- Pricing -->
<section id="pricing" class="mx-auto max-w-[1200px] px-4 pb-20 sm:px-6">
	<p class="eyebrow">Pricing</p>
	<h2 class="display mt-3 max-w-2xl text-[2rem] text-balance sm:text-[2.5rem]">
		You pay for a server being run for you
	</h2>
	<p class="mt-3 max-w-xl text-base" style="color: var(--m-ink-2)">
		Not for features being unlocked. Every plan is the same software; the difference is who keeps it
		running.
	</p>

	<div class="mt-10 grid gap-4 lg:grid-cols-3">
		{#each tiers as tier, i (tier.name)}
			<div
				class="m-card flex flex-col p-8"
				style={tier.recommended ? 'box-shadow: var(--m-shadow-lift)' : ''}
				use:reveal={{ delay: i * 70 }}
			>
				<div class="flex items-center justify-between gap-2">
					<h3 class="eyebrow">{tier.name}</h3>
					{#if tier.recommended}
						<span class="m-pill" style="border-color: var(--m-pink); color: var(--m-ink)">
							Recommended
						</span>
					{/if}
				</div>
				<p class="mt-5 flex items-baseline gap-1.5">
					<span class="display text-[2.25rem]">{tier.price}</span>
					<span class="text-sm" style="color: var(--m-ink-2)">{tier.period}</span>
				</p>
				<p class="mt-3 text-sm" style="color: var(--m-ink-2)">{tier.blurb}</p>
				<ul class="mt-6 flex flex-1 flex-col gap-3">
					{#each tier.points as point (point)}
						<li class="flex gap-2.5 text-sm">
							<Check size={16} class="mt-0.5 shrink-0" />
							{point}
						</li>
					{/each}
				</ul>
				<a
					href={tier.href}
					class="m-btn mt-7 justify-center {tier.recommended ? 'm-btn-primary' : 'm-btn-ghost'}"
				>
					{tier.cta}
				</a>
			</div>
		{/each}
	</div>
</section>

<!-- Questions -->
<section id="faq" class="mx-auto max-w-3xl px-4 pb-20 sm:px-6">
	<p class="eyebrow">Questions</p>
	<div class="mt-8 flex flex-col">
		{#each faqs as faq (faq.q)}
			<details class="group py-4" style="border-bottom: 1px solid var(--m-hairline)">
				<summary
					class="flex cursor-pointer items-center justify-between gap-4 rounded-md text-base font-medium marker:content-['']"
				>
					{faq.q}
					<span
						class="grid size-6 shrink-0 place-items-center rounded-full text-sm transition-transform duration-[180ms] group-open:rotate-45 motion-reduce:transition-none"
						style="border: 1px solid var(--m-hairline)"
						aria-hidden="true"
					>
						+
					</span>
				</summary>
				<p class="mt-3 text-sm" style="color: var(--m-ink-2)">{faq.a}</p>
			</details>
		{/each}
	</div>
</section>

<!-- The one dark band, at the conversion moment. -->
<section style="background: var(--m-ink)">
	<div class="mx-auto flex max-w-[1200px] flex-col items-start gap-6 px-4 py-20 sm:px-6">
		<h2 class="display max-w-2xl text-[2rem] text-balance sm:text-[3.5rem]" style="color: #fff">
			The fastest way to judge it is to use it.
		</h2>
		<p class="max-w-xl text-base" style="color: var(--m-hairline)">
			The demo is the real thing — 1,200 products, real orders, the same admin your staff would get.
		</p>
		<a href="/demo" class="m-btn m-btn-primary">
			Open the demo shop
			<ArrowRight size={18} />
		</a>
	</div>
</section>
