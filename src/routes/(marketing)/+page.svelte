<script lang="ts">
	import { ArrowRight, Check, MessageSquare, Banknote, ChartNoAxesCombined } from '@lucide/svelte';
	import { formatTk } from '$lib/money';
	import { reveal } from '$lib/reveal';
	import Img from '$lib/shop/Img.svelte';

	let { data } = $props();

	const facts = [
		['Cash on delivery', 'the default, not a fallback'],
		['5 channels', 'Messenger, Instagram, WhatsApp, Telegram, SMS'],
		['2 couriers', 'Steadfast and Pathao, from the order'],
		['One server', 'the whole thing, self-hosted']
	];

	const pillars = [
		{
			Icon: MessageSquare,
			eyebrow: 'Unified inbox',
			title: 'Orders arrive as messages. Answer them in one place.',
			body: 'Messenger, Instagram, WhatsApp, Telegram, SMS and the website widget land in one thread list, each carrying the product the customer was looking at. Replies go back out the way they came in.',
			panel: 'inbox'
		},
		{
			Icon: Banknote,
			eyebrow: 'Cash on delivery',
			title: 'Built for the way this market actually pays.',
			body: 'Stock is committed when an order is confirmed on the phone, not at checkout. Returns are a real outcome in the pipeline, and the refusal rate is reported on its own — a refused parcel is paid for twice and sold none.',
			panel: 'pipeline'
		},
		{
			Icon: ChartNoAxesCombined,
			eyebrow: 'Insights',
			title: 'See what people searched for and never found.',
			body: 'Sales figures cannot tell “nobody wants this” from “nobody can find it”. Every search is recorded, and the ones that returned nothing are listed on their own: demand with no product behind it.',
			panel: 'insights'
		}
	];

	const rest = [
		[
			'Catalogue',
			'Variants, bundles and coupons, with a CSV importer that recognises Shopify and WooCommerce exports.'
		],
		[
			'Pages and blog',
			'Every page is built from blocks in the admin. Nothing shopper-facing is written in code.'
		],
		[
			'Delivery',
			'All 64 districts with their areas, zone charges, courier dispatch and status sync.'
		],
		[
			'Advertising',
			'Meta, TikTok, Tag Manager and Analytics, plus purchases sent from the server.'
		],
		[
			'Search',
			'Typo-tolerant: it still finds the kettle when someone types “kettel”. Falls back to the database.'
		],
		[
			'Made to hand over',
			'Guided tours on the hardest screens, and every list in the admin behaves the same way.'
		]
	];

	const integrations = [
		'Steadfast',
		'Pathao',
		'SSLCommerz',
		'bKash',
		'Nagad',
		'Messenger',
		'WhatsApp',
		'Instagram',
		'Telegram',
		'Meta Pixel',
		'TikTok',
		'Typesense'
	];

	const steps = [
		[
			'Bring it up',
			'One command with Docker, or a plain Node build anywhere else. Postgres and search come with it.'
		],
		[
			'Make it yours',
			'Districts, starter pages, a colour, a logo, and your catalogue imported from a CSV.'
		],
		[
			'Connect what you use',
			'A courier, a payment gateway, your Facebook page. Each works alone; none is required to sell.'
		]
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

<!-- Hero. A near-white ground with one faint wash, the headline, one primary
     action — and then the product itself, large. -->
<section class="wash relative isolate overflow-hidden">
	<div class="mx-auto max-w-6xl px-4 pt-20 pb-0 text-center sm:px-6 sm:pt-28">
		<p class="eyebrow">Ecommerce for Bangladesh</p>

		<h1 class="display mx-auto mt-4 max-w-3xl text-4xl text-ink sm:text-5xl lg:text-[4rem]">
			An online shop the owner runs, not the developer.
		</h1>

		<p class="mx-auto mt-6 max-w-xl text-base text-ink-muted sm:text-lg">
			Cash on delivery, courier dispatch, and every message channel in one inbox — with a CMS your
			staff can actually operate.
		</p>

		<div class="mt-8 flex flex-wrap justify-center gap-3">
			<a
				href="/demo"
				class="flex h-12 items-center gap-2 rounded-xl bg-ink px-6 text-sm font-medium text-white
				       transition-colors duration-[180ms] ease-brand hover:bg-primary motion-reduce:transition-none"
			>
				See the live demo
				<ArrowRight size={17} />
			</a>
			<a
				href="#pricing"
				class="flex h-12 items-center rounded-xl border border-border bg-surface px-6 text-sm font-medium text-ink
				       transition-colors duration-[180ms] ease-brand hover:border-brand-300 motion-reduce:transition-none"
			>
				See pricing
			</a>
		</div>

		<p class="mt-5 text-xs text-ink-muted">Free to self-host. No card, no trial clock.</p>
	</div>

	<!-- The product, raised off the page and cropped by the fold — the pattern
	     both Dukaan and Linear use to say "this is real, keep scrolling". -->
	<div class="mx-auto mt-14 max-w-6xl px-4 sm:px-6">
		<div class="panel" use:reveal>
			<div class="flex items-center gap-3 border-b border-border bg-surface-alt px-4 py-3">
				<span class="flex gap-1.5" aria-hidden="true">
					<span class="size-2.5 rounded-full bg-border"></span>
					<span class="size-2.5 rounded-full bg-border"></span>
					<span class="size-2.5 rounded-full bg-border"></span>
				</span>
				<span class="num truncate text-xs text-ink-muted">your-shop.com.bd</span>
			</div>

			<div class="grid grid-cols-2 gap-4 p-4 sm:grid-cols-4 sm:gap-5 sm:p-6 lg:grid-cols-4">
				{#each data.preview.slice(0, 8) as p, i (p.id)}
					<article class="flex flex-col gap-2 {i >= 4 ? 'hidden lg:flex' : ''}">
						<span class="block aspect-square overflow-hidden rounded-xl bg-surface-alt">
							<Img
								src={p.image}
								width={480}
								height={480}
								priority={i === 0}
								sizes="(max-width: 640px) 45vw, 260px"
								class="size-full object-cover"
							/>
						</span>
						<span class="line-clamp-2 text-left text-xs leading-snug font-medium text-ink">
							{p.title}
						</span>
						<span class="num text-left text-sm font-semibold text-ink">{formatTk(p.price)}</span>
					</article>
				{/each}
			</div>
		</div>
	</div>
</section>

<!-- Facts, not logos. There are no customer logos to show and inventing them
     would be a lie on the front page. -->
<section class="border-y border-border bg-surface">
	<div class="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
		{#each facts as [figure, note], i (figure)}
			<div use:reveal={{ delay: i * 60 }}>
				<p class="text-base font-semibold tracking-tight text-ink">{figure}</p>
				<p class="mt-1 text-sm text-ink-muted">{note}</p>
			</div>
		{/each}
	</div>
</section>

<!-- Pillars: headline, a sentence, and the interface that does it. -->
<section id="features" class="mx-auto max-w-6xl px-4 py-24 sm:px-6">
	<div class="flex flex-col gap-24 sm:gap-32">
		{#each pillars as pillar, i (pillar.title)}
			<div
				class="grid items-center gap-10 lg:grid-cols-2 lg:gap-20 {i % 2 === 1
					? '[&>*:first-child]:lg:order-2'
					: ''}"
				use:reveal
			>
				<div>
					<p class="eyebrow flex items-center gap-2">
						<pillar.Icon size={16} />
						{pillar.eyebrow}
					</p>
					<h2 class="display mt-3 text-2xl text-ink sm:text-4xl">{pillar.title}</h2>
					<p class="mt-5 text-base text-ink-muted">{pillar.body}</p>
				</div>

				<div class="soft-card p-5 sm:p-6">
					{#if pillar.panel === 'inbox'}
						<ul class="flex flex-col gap-2.5">
							{#each [{ who: 'Nusrat', ch: 'WhatsApp', msg: 'Eta ki original? Koto din warranty?', about: 'Gazi Electric Kettle 1.8L' }, { who: 'Tanvir', ch: 'Messenger', msg: 'Chattogram e delivery charge koto?', about: 'Havit Bluetooth Speaker' }, { who: 'Sadia', ch: 'Instagram', msg: 'Ei size ta ache?', about: 'Winner Kids Frock' }] as t (t.who)}
								<li class="rounded-xl border border-border p-3.5">
									<p class="flex items-center gap-2 text-xs">
										<span class="font-medium text-ink">{t.who}</span>
										<span class="rounded-lg bg-track px-1.5 py-0.5 text-ink-muted">{t.ch}</span>
									</p>
									<p class="mt-1.5 text-sm text-ink">{t.msg}</p>
									<p class="mt-1 truncate text-xs text-ink-muted">about {t.about}</p>
								</li>
							{/each}
						</ul>
					{:else if pillar.panel === 'pipeline'}
						<ol class="flex flex-col">
							{#each [['Placed', 'Order 260908-0042 · ৳2,499', true], ['Confirmed on the phone', 'Stock committed now, not at checkout', true], ['Packed', 'Invoice printed', true], ['Sent with Steadfast', 'Consignment 91442008', true], ['Delivered — cash collected', 'Marked paid by the courier sync', false]] as [label, detail, done] (label)}
								<li class="flex gap-3 border-b border-border py-3 last:border-0 last:pb-0">
									<span
										class="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full
										       {done ? 'bg-primary text-white' : 'border border-border text-ink-faint'}"
									>
										{#if done}<Check size={12} />{/if}
									</span>
									<span class="min-w-0">
										<span class="block text-sm font-medium text-ink">{label}</span>
										<span class="num block text-xs text-ink-muted">{detail}</span>
									</span>
								</li>
							{/each}
						</ol>
					{:else}
						<p class="text-xs font-semibold tracking-wide text-ink uppercase">
							Searched for, and we had nothing
						</p>
						<ul class="mt-3 flex flex-col">
							{#each data.unmet.slice(0, 4) as row (row.term)}
								<li
									class="flex items-center justify-between gap-3 border-b border-border py-2.5 last:border-0"
								>
									<span class="truncate text-sm text-ink">{row.term}</span>
									<span class="num shrink-0 text-sm text-ink-muted">{row.searches}</span>
								</li>
							{:else}
								<li class="py-4 text-sm text-ink-muted">Every search found something.</li>
							{/each}
						</ul>
						<p class="mt-4 text-xs text-ink-muted">
							Read live from the demo shop. Every one is a shopper who wanted to spend money and
							could not.
						</p>
					{/if}
				</div>
			</div>
		{/each}
	</div>
</section>

<!-- Everything else -->
<section class="border-y border-border bg-surface">
	<div class="mx-auto max-w-6xl px-4 py-24 sm:px-6">
		<h2 class="display text-2xl text-ink sm:text-3xl">And the rest of it</h2>
		<div class="mt-12 grid gap-x-12 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
			{#each rest as [title, body], i (title)}
				<div use:reveal={{ delay: Math.min(i, 3) * 60 }}>
					<p class="text-sm font-semibold text-ink">{title}</p>
					<p class="mt-2 text-sm text-ink-muted">{body}</p>
				</div>
			{/each}
		</div>

		<div class="mt-14 border-t border-border pt-10">
			<p class="text-xs font-semibold tracking-wide text-ink-muted uppercase">Connects to</p>
			<ul class="mt-4 flex flex-wrap gap-x-8 gap-y-3">
				{#each integrations as name (name)}
					<li class="text-sm text-ink-muted">{name}</li>
				{/each}
			</ul>
		</div>
	</div>
</section>

<!-- Steps -->
<section class="mx-auto max-w-6xl px-4 py-24 sm:px-6">
	<h2 class="display text-2xl text-ink sm:text-3xl">Getting started</h2>
	<div class="mt-12 grid gap-10 sm:grid-cols-3">
		{#each steps as [title, body], i (title)}
			<div use:reveal={{ delay: i * 70 }}>
				<p class="num text-sm font-semibold text-primary">0{i + 1}</p>
				<p class="mt-3 text-base font-medium text-ink">{title}</p>
				<p class="mt-2 text-sm text-ink-muted">{body}</p>
			</div>
		{/each}
	</div>
</section>

<!-- Pricing -->
<section id="pricing" class="border-y border-border bg-surface">
	<div class="mx-auto max-w-6xl px-4 py-24 sm:px-6">
		<div class="max-w-2xl">
			<h2 class="display text-2xl text-ink sm:text-4xl">You pay for a server being run for you</h2>
			<p class="mt-4 text-base text-ink-muted">
				Not for features being unlocked. Every plan is the same software; the difference is who
				keeps it running.
			</p>
		</div>

		<div class="mt-12 grid gap-5 lg:grid-cols-3">
			{#each tiers as tier, i (tier.name)}
				<div
					class="flex flex-col rounded-2xl border bg-surface p-7 {tier.recommended
						? 'border-primary'
						: 'border-border'}"
					style={tier.recommended ? 'box-shadow: var(--m-panel)' : ''}
					use:reveal={{ delay: i * 70 }}
				>
					<div class="flex items-center justify-between gap-2">
						<h3 class="text-sm font-semibold text-ink">{tier.name}</h3>
						{#if tier.recommended}
							<span class="rounded-lg bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary">
								Recommended
							</span>
						{/if}
					</div>
					<p class="mt-5 flex items-baseline gap-1.5">
						<span class="num text-3xl font-semibold tracking-tight text-ink">{tier.price}</span>
						<span class="text-sm text-ink-muted">{tier.period}</span>
					</p>
					<p class="mt-3 text-sm text-ink-muted">{tier.blurb}</p>
					<ul class="mt-6 flex flex-1 flex-col gap-3">
						{#each tier.points as point (point)}
							<li class="flex gap-2.5 text-sm text-ink">
								<Check size={16} class="mt-0.5 shrink-0 text-primary" />
								{point}
							</li>
						{/each}
					</ul>
					<a
						href={tier.href}
						class="mt-7 flex h-11 items-center justify-center rounded-xl text-sm font-medium
						       transition-colors duration-[180ms] ease-brand motion-reduce:transition-none
						       {tier.recommended
							? 'bg-ink text-white hover:bg-primary'
							: 'border border-border text-ink hover:border-brand-300'}"
					>
						{tier.cta}
					</a>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- Questions -->
<section id="faq" class="mx-auto max-w-3xl px-4 py-24 sm:px-6">
	<h2 class="display text-2xl text-ink sm:text-3xl">Questions</h2>
	<div class="mt-10 flex flex-col">
		{#each faqs as faq (faq.q)}
			<details class="group border-b border-border py-5">
				<summary
					class="flex cursor-pointer items-center justify-between gap-4 rounded-lg text-[0.9375rem] font-medium text-ink marker:content-['']"
				>
					{faq.q}
					<span
						class="grid size-6 shrink-0 place-items-center rounded-full border border-border text-sm text-ink-muted
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
</section>

<!-- Close -->
<section class="bg-ink">
	<div class="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-24 sm:px-6">
		<h2 class="display max-w-2xl text-3xl text-white sm:text-5xl">
			The fastest way to judge it is to use it.
		</h2>
		<p class="max-w-xl text-base text-white/70">
			The demo is the real thing — the full catalogue, real orders, and the same admin your staff
			would get.
		</p>
		<a
			href="/demo"
			class="flex h-12 items-center gap-2 rounded-xl bg-white px-6 text-sm font-medium text-ink
			       transition-colors duration-[180ms] ease-brand hover:bg-brand-50 motion-reduce:transition-none"
		>
			Open the demo shop
			<ArrowRight size={17} />
		</a>
	</div>
</section>
