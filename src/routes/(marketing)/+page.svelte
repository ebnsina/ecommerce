<script lang="ts">
	import {
		ArrowRight,
		Check,
		X,
		MessageSquare,
		Banknote,
		ChartNoAxesCombined,
		Boxes,
		LayoutTemplate,
		Truck,
		Megaphone,
		Search,
		GraduationCap,
		Users,
		Brain,
		ShieldCheck,
		BadgeCheck,
		ChevronDown,
		Send
	} from '@lucide/svelte';
	import { formatTk } from '$lib/money';
	import { reveal } from '$lib/reveal';
	import { integrations } from './integrations';
	import { LAYOUTS } from '$lib/layouts';

	let { data } = $props();

	/* The reframe. Everything below only matters if this lands: the platforms
	   this competes with were built for a market that pays at checkout. */
	const contrasts = [
		{
			assumed: 'The customer pays at checkout.',
			actual:
				'They pay the courier at the door, or refuse the parcel, and you have paid for it twice.'
		},
		{
			assumed: 'The order starts on the website.',
			actual: 'It starts as “is this the original one?” in a Messenger thread at eleven at night.'
		},
		{
			assumed: 'Stock leaves when the cart is submitted.',
			actual:
				'It leaves when someone confirms on the phone. Half of those carts never get that far.'
		},
		{
			assumed: 'A developer edits the homepage.',
			actual:
				'The owner does, on a Friday afternoon, without opening a terminal or waiting on anyone.'
		}
	];

	const pillars = [
		{
			Icon: MessageSquare,
			eyebrow: 'One inbox',
			title: 'So start where the order really starts: a message.',
			body: 'Messenger, Instagram, WhatsApp, Telegram, SMS and the website widget land in one thread list. Each thread carries the product the customer was looking at, so “do you have this in a medium?” arrives with the frock attached. Replies go back out the way they came in.',
			panel: 'inbox'
		},
		{
			Icon: Banknote,
			eyebrow: 'Confirm and dispatch',
			title: 'Confirm it on the phone, then hand it to a courier.',
			body: 'Stock is committed at confirmation, not at checkout, because that is the moment the sale is real. Charges come from the district and zone. One button books the consignment with Steadfast or Pathao, and the courier sync marks the cash collected when it is delivered.',
			panel: 'pipeline'
		},
		{
			Icon: ChartNoAxesCombined,
			eyebrow: 'Insights',
			title: 'Then read what people asked for and never found.',
			body: 'Sales figures cannot tell “nobody wants this” from “nobody can find it”. Every search is recorded, and the ones that returned nothing are listed on their own. Each line is a shopper who came to spend money and left. That is your next order.',
			panel: 'insights'
		}
	];

	/* The eight things the admin actually does, each with the specifics that
	   make the claim checkable. This was a six-line list inside a fake Finder
	   window: compact, and so compressed that "Catalogue" told a reader
	   nothing. A shop owner deciding whether to move their business needs to
	   see the parts, not a summary of them. */
	const capabilities = [
		{
			Icon: Boxes,
			eyebrow: 'Catalogue',
			title: 'Everything you sell, and every way you sell it.',
			body: 'Products with variants and their own stock, categories in a tree you order yourself, bundles priced as one line, and coupons with the limits you set. Media is searchable and paged, so a shop with four thousand photographs still opens.',
			points: [
				'Variants with their own price and stock',
				'Bundles and coupons',
				'Bring a catalogue in from Shopify or WooCommerce, and take yours out whenever you like'
			]
		},
		{
			Icon: LayoutTemplate,
			eyebrow: 'Pages and posts',
			title: 'The shop is edited by the person who runs it.',
			body: 'Every page is stacked from blocks — banners, category tiles, product rails, countdowns, rich text — arranged in the admin and previewed before anyone sees them. Pick the shape that suits what you sell, too: a grocer gets tight rows of many small things, a bookshop gets tall covers, an electronics shop gets a list with the price beside each one. Menus, the blog and the store settings are the same: data, not code.',
			points: [
				'A block builder with live preview',
				'Five shop layouts, each with its own shape and colour',
				'Menus, settings and theme'
			]
		},
		{
			Icon: Truck,
			eyebrow: 'Orders and delivery',
			title: 'From a confirmed phone call to a parcel at the door.',
			body: 'All 64 districts and their areas are seeded with zone charges you can change without touching a file. Confirm an order, print the invoice, book the consignment, and let the courier sync reconcile what actually happened.',
			points: [
				'64 districts, areas and zone charges',
				'Steadfast and Pathao from the order',
				'Returns and refusals as real outcomes'
			]
		},
		{
			Icon: Users,
			eyebrow: 'Customers',
			title: 'Who bought what, and what they said about it.',
			body: 'A customer record with their orders and addresses, reviews you approve before they appear, and questions on a product page answered in public. Abandoned carts are listed with the reminder that was sent and whether it worked.',
			points: [
				'Orders and addresses per customer',
				'Moderated reviews and questions',
				'Abandoned carts with recovery'
			]
		},
		{
			Icon: Search,
			eyebrow: 'Search',
			title: 'It finds the kettle when someone types “kettel”.',
			body: 'A shopper who cannot spell your product name still finds it. Typos, near-misses and Bangla alongside English all land on the right page — because the sale you lose to a misspelling is the one nobody ever tells you about.',
			points: [
				'Forgives typos and near-misses',
				'Bangla and English in the same box',
				'Or describe it — "a gift for my sister under 2000" — and get real products'
			]
		},
		{
			Icon: ChartNoAxesCombined,
			eyebrow: 'Insights',
			title: 'What sold, what was looked at, and what was never found.',
			body: 'Revenue and orders over any window, the products people viewed but did not buy, the refusal rate on its own, and every search that returned nothing — the one number that tells you what to stock next.',
			points: [
				'Revenue, orders and refusals',
				'Views and add-to-carts per product',
				'Searches that found nothing'
			]
		},
		{
			Icon: Megaphone,
			eyebrow: 'Advertising',
			title: 'The pixel fires even when the browser blocks it.',
			body: 'Sales are reported back to Meta, TikTok, Tag Manager and Analytics by the shop itself as well as by the browser, so an ad blocker cannot hide the purchase your advertising just paid for.',
			points: [
				'Meta and TikTok, connected from a settings screen',
				'Sales still counted when a browser blocks trackers',
				'You can see which advertising paid for itself'
			]
		},
		{
			Icon: GraduationCap,
			eyebrow: 'Handing it over',
			title: 'Built to be given to someone who did not build it.',
			body: 'The page builder, the pages list and the menus screen walk through themselves the first time they are opened, and a “Show me how” button brings the walkthrough back later. Every list filters, sorts and selects the same way.',
			points: [
				'Guided tours on the hardest screens',
				'One list pattern everywhere',
				'Staff accounts with their own sign-in'
			]
		}
	];

	/* Pricing has to pay for the thing. An earlier pass led with a free
	   self-hosted tier, which is a good way to be popular and a bad way to
	   still exist in a year: the support load arrives either way, and none of
	   it is billed. So every plan is paid, and what separates them is how much
	   of the running and the setting-up we do — never which features unlock. */
	const tiers = [
		{
			name: 'Starter',
			prefix: '',
			price: formatTk(190000),
			period: 'per month',
			blurb:
				'One shop, hosted, backed up and on your domain. Everything above, from the first day.',
			points: [
				'Hosting, daily backups and TLS on your domain',
				'Search and image storage included',
				'Upgrades applied for you',
				'Support by email, next business day'
			],
			cta: 'Start a 14-day trial',
			href: '/demo/pages/contact',
			recommended: false
		},
		{
			name: 'Business',
			prefix: '',
			price: formatTk(450000),
			period: 'per month',
			blurb:
				'The same shop with the awkward parts already wired up: courier, gateway, Facebook page, your old catalogue.',
			points: [
				'Everything in Starter',
				'Courier, gateway and Facebook page connected for you',
				'Catalogue migrated from Shopify, WooCommerce or a spreadsheet',
				'Support by phone and WhatsApp during business hours',
				'A training session for your staff'
			],
			cta: 'Start a 14-day trial',
			href: '/demo/pages/contact',
			recommended: true
		},
		{
			name: 'Custom',
			prefix: 'From',
			price: formatTk(1500000),
			period: 'per month',
			blurb:
				'Several outlets, a warehouse system, or your own servers. A named contact and an agreed response time.',
			points: [
				'Everything in Business',
				'Bespoke integrations, ERP and stock imports',
				'Self-hosted on your infrastructure, if you prefer',
				'A named contact and an agreed response time'
			],
			cta: 'Talk to us',
			href: '/demo/pages/contact',
			recommended: false
		}
	];

	const faqs = [
		{
			q: 'Why is there no free plan?',
			a: 'Because the support would not be free. A shop that cannot dispatch a parcel on a Thursday afternoon needs an answer that afternoon, and answering costs the same whether or not anyone paid for it. A price we can hold for years is worth more to you than a free tier we quietly abandon. Nothing is feature-gated. The cheapest plan is the whole platform.'
		},
		{
			q: 'Can I run it on my own server?',
			a: 'On the Custom plan, yes — the whole shop runs on your own machines and nothing leaves them. What you pay for there is the software and a person to call, not the machine. On Starter and Business we run it for you, because for nearly every shop that is cheaper than the hours it takes to run properly, and it is one less thing to be woken up by.'
		},
		{
			q: 'Is cash on delivery really supported?',
			a: 'It is the default path, not a fallback. Stock is committed when the order is confirmed on the phone rather than at checkout. Return is a real outcome in the pipeline, not an edit to a delivered order. The refusal rate is reported on its own, because a refused parcel is paid for twice and sold none. Courier sync marks a delivered parcel paid.'
		},
		{
			q: 'Can a customer just describe what they want?',
			a: 'Yes. There is a box in the shop that takes a sentence — "a gift for my sister under 2000 taka" — and comes back with real products they can put in a basket. The assistant never writes a price or a stock level; all it does is turn the sentence into a search of your own catalogue, choosing from your own categories and brands, so it cannot offer something you do not sell. Every question is recorded, so the ones you had no answer for show up in Insights.'
		},
		{
			q: 'Does the AI assistant reply to customers by itself?',
			a: 'Only if you switch it on, one channel at a time, above a confidence level you set. It answers delivery charges, delivery times, payment methods, returns and opening hours, all from your own settings. Anything about a particular order, a price, a refund or a complaint is left for a person. It never replies on a thread a colleague has picked up, and every automatic reply is marked as the assistant.'
		},
		{
			q: 'Do my staff need training?',
			a: 'Not a course. The page builder, the pages list and the menus screen walk through themselves the first time they are opened, and a “Show me how” button brings the walkthrough back later. Every list in the admin filters, sorts and selects the same way, so someone who has learned the orders screen already knows the products screen.'
		},
		{
			q: 'Can I bring my catalogue over from Shopify or WooCommerce?',
			a: 'Yes. Export your products from either one, upload the file, and it works out on its own which shop it came from and tells you before anything is written. A plain spreadsheet works too. Your catalogue exports back out the same way, so it stays yours to take somewhere else if you ever want to.'
		},
		{
			q: 'What happens if I connect nothing at all?',
			a: 'It still sells on day one. Search stops forgiving spelling, sign-in codes have to be passed on by a person, and consignments are typed into the courier’s own site by hand. Each thing you connect takes one of those chores away. Not one of them stands between you and taking an order.'
		}
	];
</script>

<svelte:head>
	<title>Dukkan — an online shop for how Bangladesh buys</title>
	<meta
		name="description"
		content="Ecommerce for Bangladesh: cash on delivery, Steadfast and Pathao dispatch, Messenger and WhatsApp orders in one inbox, and a storefront you edit yourself."
	/>
</svelte:head>

<!-- ── Hero ───────────────────────────────────────────────────────────────
     One screen. The photograph is positioned across the bottom half rather
     than stacked under the copy, so the copy has the whole height to sit in
     and centres in it — the padding at each end is the room the floating
     header and the dock need, which is what keeps the space above and below
     the sentence even. -->
<section id="top" class="mesh relative isolate flex min-h-screen flex-col overflow-hidden">
	<div
		class="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-4 pt-24 pb-28 text-center sm:px-6"
	>
		<h1 class="display mx-auto max-w-5xl text-[clamp(2.25rem,6.2vw,4.25rem)] text-ink">
			The orders arrive on Messenger.
			<span class="text-primary">The shop should meet them there.</span>
		</h1>

		<p class="mx-auto mt-7 max-w-xl text-base text-ink-muted sm:text-lg">
			Cash on delivery, five message channels in one inbox, Steadfast and Pathao dispatch, and a
			storefront you edit yourself. Built for how Bangladesh actually buys.
		</p>

		<div class="mt-9 flex flex-wrap justify-center gap-3">
			<a
				href="/demo"
				class="flex h-14 items-center gap-2 rounded-xl bg-primary px-8 text-[0.9375rem] font-medium text-white
				       transition-colors duration-[180ms] ease-brand hover:bg-primary-hover motion-reduce:transition-none"
			>
				See the live demo
				<ArrowRight size={17} />
			</a>
			<a
				href="#pricing"
				class="flex h-14 items-center rounded-xl border border-border bg-surface px-8 text-[0.9375rem] font-medium text-ink
				       transition-colors duration-[180ms] ease-brand hover:border-brand-300 motion-reduce:transition-none"
			>
				See pricing
			</a>
		</div>

		<p class="mt-5 text-xs font-medium text-ink">
			14 days free, no card. Then from ৳1,900 a month.
		</p>
	</div>

	<!-- The picture, and nothing else. A browser frame around a product grid was
	     a drawing of a shop; this is Nilgiri in Bandarban, which is the country
	     the shop is in. The buttons sit over its top edge, which is why the crop
	     is taken from the hazy upper third rather than the hills. -->
	<img
		src="/img/hero-banner.jpg"
		alt=""
		width="1920"
		height="1080"
		class="hero-shot absolute inset-x-0 bottom-0"
	/>
</section>

<!-- ── The reframe ───────────────────────────────────────────────────────
     On a shaded band, because it is a change of subject rather than another
     feature. The rows are white cards on the grey, which is the same idea one
     step smaller. -->
<section id="problem" class="shade relative overflow-hidden">
	<div class="mx-auto max-w-6xl px-4 py-28 sm:px-6 sm:py-40">
		<div class="max-w-2xl">
			<p class="eyebrow">Why this exists</p>
			<h2 class="display h2 mt-4 text-ink">
				The platforms you can buy were built for a market that pays at checkout.
			</h2>
			<p class="mt-6 max-w-xl text-base text-ink-muted">
				Shopify and WooCommerce are very good at a shape of commerce this country does not have. So
				you end up running the real shop in a Facebook inbox and a notebook, and the software holds
				only the part that already went right.
			</p>
		</div>

		<!-- Revealed as one card. The rows are white on a border-coloured ground
		     with a hairline gap; fading them in one at a time meant the ground
		     showed through as a grey block until the last one landed. -->
		<ul
			class="mt-20 grid gap-px overflow-hidden rounded-3xl border border-border bg-border sm:mt-28"
			use:reveal
		>
			{#each contrasts as row (row.assumed)}
				<li class="grid gap-4 bg-surface p-7 sm:grid-cols-2 sm:gap-10 sm:p-9">
					<p class="flex gap-3 text-sm text-ink-muted">
						<X size={16} class="mt-0.5 shrink-0" aria-hidden="true" />
						<span><span class="sr-only">The assumption: </span>{row.assumed}</span>
					</p>
					<p class="flex gap-3 text-sm font-medium text-ink">
						<Check size={16} class="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
						<span><span class="sr-only">What actually happens: </span>{row.actual}</span>
					</p>
				</li>
			{/each}
		</ul>
	</div>
</section>

<!-- ── Pillars ─────────────────────────────────────────────────────────── -->
<section id="features" class="mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
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
						<pillar.Icon size={15} />
						{pillar.eyebrow}
					</p>
					<h2 class="display h2 mt-4 text-ink">{pillar.title}</h2>
					<p class="mt-5 text-base text-ink-muted">{pillar.body}</p>
				</div>

				{#if pillar.panel === 'inbox'}
					<!-- A conversation, not a list of rows. The point of the section is
					     that the order is a chat, so the panel is one. -->
					<div class="soft-card overflow-hidden">
						<div class="flex items-center gap-3 border-b border-border px-4 py-3">
							<span
								class="grid size-9 shrink-0 place-items-center rounded-full bg-track text-sm font-semibold text-ink"
								aria-hidden="true">N</span
							>
							<span class="min-w-0 flex-1">
								<span class="block text-sm font-medium text-ink">Nusrat Jahan</span>
								<span class="flex items-center gap-1.5 text-xs text-ink-muted">
									<img src="/logos/whatsapp.svg" alt="" width="12" height="12" />
									WhatsApp · online
								</span>
							</span>
							<span class="rounded-lg bg-track px-2 py-1 text-xs text-ink-muted">Open</span>
						</div>

						<div class="flex flex-col gap-3 bg-surface-alt p-4">
							<p class="mx-auto rounded-full bg-surface px-3 py-1 text-[0.6875rem] text-ink-muted">
								Today, 11:04 pm
							</p>

							<span
								class="max-w-[85%] self-start rounded-2xl rounded-bl-md border border-border bg-surface px-3.5 py-2.5"
							>
								<span class="block text-sm text-ink"
									>Is this the original one? How long is the warranty?</span
								>
								<span class="mt-2 flex items-center gap-2 rounded-lg bg-track px-2 py-1.5">
									<span class="block size-6 shrink-0 rounded bg-border" aria-hidden="true"></span>
									<span class="truncate text-[0.6875rem] text-ink-muted">
										Gazi Electric Kettle 1.8L
									</span>
								</span>
							</span>

							<span class="max-w-[85%] self-end rounded-2xl rounded-br-md bg-primary px-3.5 py-2.5">
								<span class="block text-sm text-white">
									Yes, it is genuine, with a one year warranty.
								</span>
								<span class="mt-1 block text-right text-[0.625rem] text-white/70">
									Sent from Dukkan · 11:05 pm
								</span>
							</span>

							<span
								class="max-w-[85%] self-start rounded-2xl rounded-bl-md border border-border bg-surface px-3.5 py-2.5 text-sm text-ink"
							>
								Good. I want to order one. Is cash on delivery available?
							</span>
						</div>

						<div class="flex items-center gap-2 border-t border-border px-4 py-3">
							<span class="flex-1 truncate text-sm text-ink-muted">Reply to Nusrat…</span>
							<span
								class="grid size-8 shrink-0 place-items-center rounded-xl bg-primary text-white"
								aria-hidden="true"
							>
								<Send size={14} />
							</span>
						</div>
					</div>
				{:else if pillar.panel === 'pipeline'}
					<!-- A timeline with a rail, because the order moves through time and
					     a flat checklist hides that. -->
					<div class="soft-card p-6 sm:p-8">
						<ol class="relative flex flex-col">
							<span
								class="absolute top-2 bottom-6 left-[0.5625rem] w-px bg-border"
								aria-hidden="true"
							></span>

							{#each [['Placed', 'Order 260908-0042 · ৳2,499', '6:12 pm', true], ['Confirmed on the phone', 'Stock committed now, not at checkout', '6:41 pm', true], ['Packed', 'Invoice printed', '9:02 am', true], ['Sent with Steadfast', 'Consignment 91442008', '11:20 am', true], ['Delivered — cash collected', 'Marked paid by the courier sync', 'Pending', false]] as [label, detail, when, done] (label)}
								<li class="relative flex gap-4 pb-7 last:pb-0">
									<span
										class="relative z-10 mt-1 grid size-[1.125rem] shrink-0 place-items-center rounded-full
										       {done ? 'bg-primary text-white' : 'border-2 border-dashed border-border bg-surface'}"
									>
										{#if done}<Check size={11} />{/if}
									</span>
									<span class="min-w-0 flex-1">
										<span class="flex flex-wrap items-baseline justify-between gap-x-3">
											<span class="text-sm font-medium {done ? 'text-ink' : 'text-ink-muted'}">
												{label}
											</span>
											<span class="num text-[0.6875rem] text-ink-faint">{when}</span>
										</span>
										<span class="num mt-0.5 block text-xs text-ink-muted">{detail}</span>
									</span>
								</li>
							{/each}
						</ol>
					</div>
				{:else}
					<!-- The search box itself, mid-query and finding nothing. The rows
					     underneath are the real ones, read live from the demo. -->
					<div class="soft-card overflow-hidden">
						<div class="flex items-center gap-2.5 border-b border-border px-4 py-3.5">
							<Search size={16} class="shrink-0 text-ink-muted" aria-hidden="true" />
							<span class="flex-1 text-sm text-ink">
								ac 1.5 ton<span class="caret" aria-hidden="true"></span>
							</span>
							<span class="num rounded-lg bg-track px-2 py-0.5 text-xs text-ink-muted">
								0 results
							</span>
						</div>

						<p
							class="border-b border-border bg-surface-alt px-4 py-6 text-center text-sm text-ink-muted"
						>
							Nothing in the catalogue matches that.
						</p>

						<p class="px-4 pt-4 text-xs font-semibold tracking-wide text-ink uppercase">
							Asked for this week, and we had nothing
						</p>
						<ul class="flex flex-col px-4 pb-4">
							{#each data.unmet.slice(0, 4) as row (row.term)}
								<li
									class="flex items-center justify-between gap-3 border-b border-border py-2.5 last:border-0"
								>
									<span class="flex min-w-0 items-center gap-2.5">
										<Search size={13} class="shrink-0 text-ink-faint" aria-hidden="true" />
										<span class="truncate text-sm text-ink">{row.term}</span>
									</span>
									<span class="num shrink-0 text-sm text-ink-muted">{row.searches}</span>
								</li>
							{:else}
								<li class="py-4 text-sm text-ink-muted">Every search found something.</li>
							{/each}
						</ul>
					</div>
				{/if}
			</div>
		{/each}
	</div>
</section>

<!-- ── The assistant ──────────────────────────────────────────────────────
     A screen of its own, on the only gradient the page allows, for the only
     part of the product that writes something a customer will read. It is also
     the part most likely to be assumed reckless, so it leads with what it
     refuses to do. -->
<section id="assistant" class="ai-ground flex min-h-screen items-center overflow-hidden">
	<div class="mx-auto w-full max-w-6xl px-4 py-28 sm:px-6 sm:py-36">
		<div class="max-w-2xl">
			<p class="eyebrow flex items-center gap-2">
				<Brain size={16} />
				The assistant
			</p>
			<h2 class="display h2 mt-4 text-ink">
				It answers the same four questions all night, and helps the rest find what they came for.
			</h2>
			<p class="mt-6 max-w-xl text-base text-ink-muted">
				Delivery charge, delivery time, payment methods, opening hours. Every one is answerable from
				your own settings, and every one arrives at eleven at night. It takes those and leaves
				everything else alone. Off until you switch it on, one channel at a time — and it is not
				tied to any one AI company, so a price rise or an outage on their side is a setting you
				change rather than a shop that stops answering.
			</p>
			<p class="mt-5 max-w-xl text-base text-ink-muted">
				In the shop it does the other half of a shopkeeper's job. A customer describes what they are
				after — “a gift for my sister under 2000 taka” — and gets real products with a basket button
				on them. It never writes a price or a stock level: all it does is turn a sentence into a
				search of your own catalogue, so it cannot promise something you do not have. Every
				conversation is kept, on its own page, so a shopper who was interrupted comes back to where
				they left off — and the prices in it are re-read from the shop each time it is opened, never
				replayed from what was said.
			</p>
		</div>

		<ol class="mt-20 grid gap-12 sm:mt-24 lg:grid-cols-3 lg:gap-16">
			{#each [{ n: '01', t: 'You switched it on, for that channel', d: 'Off by default, and off for every channel you have not turned on. There is also one switch that stops it everywhere at once, for the day you want it quiet and do not want to go looking.' }, { n: '02', t: 'The question is on the allowlist', d: 'Delivery charge, delivery time, payment methods, cash on delivery, returns, opening hours, and hello. Anything about a particular order, price, refund or complaint is never answered automatically, however sure the model claims to be.' }, { n: '03', t: 'Its own confidence clears your bar', d: 'You set the threshold. Under it the thread is left untouched for a person, which is the same outcome as having no assistant at all.' }] as gate (gate.n)}
				<li class="border-t border-border pt-6" use:reveal>
					<p class="num text-sm font-semibold text-primary">{gate.n}</p>
					<p class="mt-4 text-lg font-medium text-ink">{gate.t}</p>
					<p class="mt-3 text-base text-ink-muted">{gate.d}</p>
				</li>
			{/each}
		</ol>

		<p class="mt-16 flex max-w-3xl gap-3 text-base text-ink-muted sm:mt-20">
			<ShieldCheck size={18} class="mt-1 shrink-0 text-primary" aria-hidden="true" />
			<span>
				It never replies on a thread a colleague has picked up, never answers the same conversation
				twice, and every automatic reply is marked as the assistant in the inbox with the thread
				left unread.
			</span>
		</p>
	</div>
</section>

<!-- ── Everything else, one screen each ───────────────────────────────────
     This was six lines in a fake Finder window, then eight cards. Both were
     compact enough that "Catalogue" told a reader nothing, which is a poor
     trade when the reader is deciding whether to move their business onto it.
     A section each, alternating ground so the run does not read as a list. -->
{#each capabilities as cap, i (cap.eyebrow)}
	<section
		class="flex min-h-[80vh] items-center border-t border-border {i % 2 === 0
			? 'bg-surface'
			: 'shade'}"
	>
		<div class="mx-auto w-full max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
			<div
				class="grid gap-10 lg:grid-cols-2 lg:gap-20 {i % 2 === 1
					? '[&>*:first-child]:lg:order-2'
					: ''}"
				use:reveal
			>
				<div>
					<p class="eyebrow flex items-center gap-2">
						<cap.Icon size={15} />
						{cap.eyebrow}
					</p>
					<h2 class="display h2 mt-4 text-ink">{cap.title}</h2>
				</div>

				<div class="lg:pt-2">
					<p class="text-base text-ink-muted sm:text-lg">{cap.body}</p>
					<ul class="mt-10 flex flex-col gap-1">
						{#each cap.points as point (point)}
							<li class="flex gap-3 py-2.5 text-base text-ink">
								<BadgeCheck size={19} class="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
								{point}
							</li>
						{/each}
					</ul>
				</div>
			</div>
		</div>
	</section>
{/each}

<!-- ── The demos ──────────────────────────────────────────────────────────
     Five links, because a claim about layouts is only worth as much as the
     five shops a reader can open and compare. Each one is the same catalogue
     and the same brand colour wearing a different shape. -->
<section id="demos" class="shade border-t border-border">
	<div class="mx-auto max-w-6xl px-4 py-28 sm:px-6 sm:py-36">
		<p class="eyebrow">Five shops, one platform</p>
		<h2 class="display h2 mt-4 max-w-xl text-ink">Open them. They are the same shop.</h2>
		<p class="mt-5 max-w-xl text-base text-ink-muted">
			Same catalogue, same colours, same typeface — arranged the way each kind of shop is actually
			arranged. Pick one and it stays picked until you pick another.
		</p>

		<ul class="mt-16 grid gap-4 sm:mt-20 sm:grid-cols-2 lg:grid-cols-3">
			{#each Object.values(LAYOUTS) as l, i (l.key)}
				<li use:reveal={{ delay: Math.min(i, 4) * 50 }}>
					<a
						href="/demo?layout={l.key}"
						class="flat-card flex h-full flex-col gap-2 p-6 transition-colors duration-[180ms] ease-brand hover:border-primary motion-reduce:transition-none"
					>
						<span class="flex items-center gap-2 text-base font-medium text-ink">
							{l.label}
							<ArrowRight size={15} aria-hidden="true" />
						</span>
						<span class="text-sm leading-relaxed text-ink-muted">{l.note}</span>
					</a>
				</li>
			{/each}
		</ul>
	</div>
</section>

<!-- ── Integrations ────────────────────────────────────────────────────────
     A moving belt of twelve nouns was a paragraph pretending to be a shelf.
     This is the shelf: one tile each, the mark where there is one, and what
     the thing is actually for — because "Steadfast" means nothing to a reader
     who has not run a shop here, and "Courier" does. -->
<section id="integrations" class="mx-auto max-w-6xl px-4 py-28 sm:px-6 sm:py-36">
	<p class="eyebrow">Integrations</p>
	<h2 class="display h2 mt-4 max-w-xl text-ink">It connects to what you already pay for.</h2>
	<p class="mt-5 max-w-xl text-base text-ink-muted">
		The couriers who deliver for you, the gateways your customers pay with, the pages they message
		you on, and the places you advertise. Each works on its own, and none of them is required before
		you can sell.
	</p>

	<ul class="mt-16 grid grid-cols-2 gap-4 sm:mt-20 sm:grid-cols-3 lg:grid-cols-4">
		{#each integrations as item, i (item.name)}
			<li class="flat-card flex items-center gap-4 p-5" use:reveal={{ delay: Math.min(i, 4) * 50 }}>
				<span class="grid size-11 shrink-0 place-items-center rounded-xl border border-border">
					{#if item.logo}
						<img src={item.logo} alt="" width="22" height="22" loading="lazy" decoding="async" />
					{:else}
						<span class="display text-sm text-ink" aria-hidden="true">
							{item.name.slice(0, 2)}
						</span>
					{/if}
				</span>
				<span class="min-w-0">
					<span class="block truncate text-sm font-medium text-ink">{item.name}</span>
					<span class="block text-xs text-ink-muted">{item.role}</span>
				</span>
			</li>
		{/each}
	</ul>
</section>

<!-- ── Pricing ─────────────────────────────────────────────────────────── -->
<section id="pricing" class="mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
	<div class="max-w-2xl">
		<p class="eyebrow">Pricing</p>
		<h2 class="display h2 mt-4 text-ink">You pay for the running, not the features.</h2>
		<p class="mt-5 text-base text-ink-muted">
			Every plan is the whole platform. Nothing on this page sits behind a higher tier. What changes
			is how much of the hosting, the connecting and the answering at four on a Thursday we do.
		</p>
	</div>

	<div class="mt-16 grid items-start gap-5 sm:mt-20 lg:grid-cols-3">
		{#each tiers as tier, i (tier.name)}
			<div
				class="flex flex-col rounded-3xl border p-8 {tier.recommended
					? 'border-primary bg-surface lg:-mt-6 lg:pb-12'
					: 'border-border bg-surface'}"
				style={tier.recommended ? 'box-shadow: var(--m-card)' : ''}
				use:reveal={{ delay: i * 70 }}
			>
				<div class="flex items-center justify-between gap-2">
					<h3 class="text-sm font-semibold text-ink">{tier.name}</h3>
					{#if tier.recommended}
						<span class="rounded-lg bg-primary-soft px-2.5 py-1 text-xs font-medium text-primary">
							Most shops start here
						</span>
					{/if}
				</div>

				<p class="mt-6 flex flex-wrap items-baseline gap-x-1.5">
					{#if tier.prefix}
						<span class="text-sm text-ink-muted">{tier.prefix}</span>
					{/if}
					<span class="num text-4xl font-semibold tracking-tight text-ink">{tier.price}</span>
					<span class="text-sm text-ink-muted">{tier.period}</span>
				</p>
				<p class="mt-3 text-sm text-ink-muted">{tier.blurb}</p>

				<ul class="mt-7 flex flex-1 flex-col gap-3">
					{#each tier.points as point (point)}
						<li class="flex gap-2.5 text-sm text-ink">
							<Check size={16} class="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
							{point}
						</li>
					{/each}
				</ul>

				<a
					href={tier.href}
					class="mt-9 flex h-13 items-center justify-center rounded-xl text-[0.9375rem] font-medium
					       transition-colors duration-[180ms] ease-brand motion-reduce:transition-none
					       {tier.recommended
						? 'bg-primary text-white hover:bg-primary-hover'
						: 'border border-border text-ink hover:border-brand-300'}"
				>
					{tier.cta}
				</a>
			</div>
		{/each}
	</div>

	<p class="mt-8 text-sm text-ink-muted">
		Per shop, in taka, excluding VAT. Pay yearly and two months are on us. The 14-day trial takes no
		card, and if it is not right nothing is owed.
	</p>
</section>

<!-- ── Questions ───────────────────────────────────────────────────────── -->
<section id="faq" class="border-t border-border bg-surface">
	<div
		class="mx-auto grid max-w-6xl gap-12 px-4 py-28 sm:px-6 sm:py-36 lg:grid-cols-[20rem_1fr] lg:gap-20"
	>
		<div>
			<h2 class="display h2 text-ink">Questions</h2>
			<p class="mt-4 text-sm text-ink-muted">
				Anything not answered here, ask on the demo shop's contact page. It arrives in the same
				inbox this page has been describing.
			</p>
		</div>

		<div class="flex flex-col border-t border-border">
			{#each faqs as faq (faq.q)}
				<details class="group border-b border-border py-5">
					<summary
						class="flex cursor-pointer items-center justify-between gap-4 rounded-lg text-[0.9375rem] font-medium text-ink marker:content-['']"
					>
						{faq.q}
						<ChevronDown
							size={18}
							class="shrink-0 text-ink-muted transition-transform duration-[180ms] ease-brand
							       group-open:rotate-180 motion-reduce:transition-none"
							aria-hidden="true"
						/>
					</summary>
					<p class="mt-3 max-w-2xl text-sm text-ink-muted">{faq.a}</p>
				</details>
			{/each}
		</div>
	</div>
</section>

<!-- ── Close ───────────────────────────────────────────────────────────── -->
<section class="shade relative overflow-hidden">
	<div class="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-24 sm:px-6 sm:py-32">
		<h2 class="display max-w-2xl text-[clamp(2rem,5vw,3.5rem)] text-ink">
			Stop reading about it. The demo is the real thing.
		</h2>
		<p class="max-w-xl text-base text-ink-muted">
			Full catalogue, real orders, the same admin your staff would use. Leave a name and a number
			and it opens — then place an order, and go into the inbox and answer yourself.
		</p>
		<div class="mt-2 flex flex-wrap gap-3">
			<a
				href="/demo"
				class="flex h-14 items-center gap-2 rounded-xl bg-primary px-8 text-[0.9375rem] font-medium text-white
				       transition-colors duration-[180ms] ease-brand hover:bg-primary-hover motion-reduce:transition-none"
			>
				Open the demo shop
				<ArrowRight size={17} />
			</a>
			<a
				href="/demo/pages/contact"
				class="flex h-14 items-center rounded-xl border border-border bg-surface px-8 text-[0.9375rem] font-medium text-ink
				       transition-colors duration-[180ms] ease-brand hover:border-brand-300 motion-reduce:transition-none"
			>
				Talk to us
			</a>
		</div>
	</div>
</section>
