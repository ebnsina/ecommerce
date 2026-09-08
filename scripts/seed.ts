/**
 * Bootstrap: first owner account + default settings.
 * Run: pnpm db:seed  (idempotent — safe to re-run)
 */
import postgres from 'postgres';
import { count, eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import { hashPassword } from '../src/lib/server/password.ts';
import * as s2 from '../src/lib/server/db/schema.ts';
import { slugify } from '../src/lib/slug.ts';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');

const db = drizzle(postgres(url), { schema: s2, casing: 'snake_case' });

const email = process.env.SEED_EMAIL ?? 'owner@store.test';
const password = process.env.SEED_PASSWORD ?? 'changeme123';

await db
	.insert(s2.adminUsers)
	.values({ name: 'Owner', email, passwordHash: await hashPassword(password), role: 'owner' })
	.onConflictDoNothing({ target: s2.adminUsers.email });

const defaults: Record<string, unknown> = {
	store: {
		name: 'My Store',
		phone: '09613-800800',
		email: 'support@store.test',
		supportHours: 'Call us 9 AM – 10 PM',
		logo: { mode: 'text', text: 'My Store', image: null }
	},
	auth: { otpEnabled: true, otpTtlMinutes: 5, maxAttempts: 5 },
	delivery: {
		// poisha
		inside_dhaka: { label: 'Inside Dhaka', charge: 6000, freeAbove: 100000 },
		suburban_dhaka: { label: 'Dhaka Sub-urban', charge: 10000, freeAbove: 150000 },
		outside_dhaka: { label: 'Outside Dhaka', charge: 13000, freeAbove: 200000 }
	},
	payment: { cod: true, sslcommerz: false, codMaxOrder: 5000000 },
	social: { facebook: '', instagram: '', youtube: '' },
	contact: { whatsapp: '01712345678', messenger: '', callEnabled: true },
	footer: {
		// Logos are left blank: the owner uploads each one in Settings, so nothing
		// here ships a mark we do not have the right to distribute.
		paymentMethods: [
			{ name: 'bKash', logo: '' },
			{ name: 'Nagad', logo: '' },
			{ name: 'Rocket', logo: '' },
			{ name: 'Visa', logo: '' },
			{ name: 'Mastercard', logo: '' },
			{ name: 'Cash on delivery', logo: '' }
		],
		note: 'Prices include VAT where applicable.'
	},
	assurances: [
		{ icon: 'Truck', title: 'Delivery in 2–5 days', note: 'Anywhere in Bangladesh' },
		{ icon: 'RotateCcw', title: '7-day return', note: 'Unused items, original packaging' },
		{ icon: 'ShieldCheck', title: 'Brand warranty', note: 'Genuine product guaranteed' },
		{ icon: 'Banknote', title: 'Cash on delivery', note: 'Pay the courier when it arrives' }
	],
	search: {
		hints: [
			'Search for rice, oil, groceries',
			'Search for air fryers and cookers',
			'Search for water purifiers',
			'Search for kitchen and dinner sets',
			'Search for furniture'
		]
	},
	promo: {
		text: 'Free delivery on orders over ৳1,000 inside Dhaka',
		textBn: '',
		href: '',
		active: true,
		dismissible: true
	}
};

for (const [key, value] of Object.entries(defaults)) {
	await db
		.insert(s2.settings)
		.values({ key, value })
		.onConflictDoNothing({ target: s2.settings.key });
}

/* Delivery geography: the 64 districts, with thana-level areas for the metros.
   Zone lives on the region so the charge is derived, never chosen. */
const INSIDE = [
	'Dhanmondi',
	'Gulshan',
	'Banani',
	'Mirpur',
	'Mohammadpur',
	'Uttara',
	'Motijheel',
	'Tejgaon',
	'Badda',
	'Rampura',
	'Bashundhara',
	'Mohakhali',
	'Farmgate',
	'Shyamoli',
	'Khilgaon',
	'Jatrabari',
	'Wari',
	'Lalbagh',
	'Kotwali',
	'Pallabi',
	'Cantonment',
	'Adabar',
	'Hazaribagh',
	'Kamrangirchar',
	'Demra'
];
const SUBURBAN = ['Savar', 'Keraniganj', 'Dohar', 'Nawabganj', 'Dhamrai'];

const DISTRICTS: [string, string, 'inside_dhaka' | 'suburban_dhaka' | 'outside_dhaka'][] = [
	['Dhaka', 'ঢাকা', 'inside_dhaka'],
	['Gazipur', 'গাজীপুর', 'suburban_dhaka'],
	['Narayanganj', 'নারায়ণগঞ্জ', 'suburban_dhaka'],
	['Munshiganj', 'মুন্সিগঞ্জ', 'suburban_dhaka'],
	['Manikganj', 'মানিকগঞ্জ', 'suburban_dhaka'],
	['Narsingdi', 'নরসিংদী', 'suburban_dhaka'],
	['Chattogram', 'চট্টগ্রাম', 'outside_dhaka'],
	["Cox's Bazar", 'কক্সবাজার', 'outside_dhaka'],
	['Cumilla', 'কুমিল্লা', 'outside_dhaka'],
	['Feni', 'ফেনী', 'outside_dhaka'],
	['Brahmanbaria', 'ব্রাহ্মণবাড়িয়া', 'outside_dhaka'],
	['Chandpur', 'চাঁদপুর', 'outside_dhaka'],
	['Lakshmipur', 'লক্ষ্মীপুর', 'outside_dhaka'],
	['Noakhali', 'নোয়াখালী', 'outside_dhaka'],
	['Khagrachhari', 'খাগড়াছড়ি', 'outside_dhaka'],
	['Rangamati', 'রাঙ্গামাটি', 'outside_dhaka'],
	['Bandarban', 'বান্দরবান', 'outside_dhaka'],
	['Sylhet', 'সিলেট', 'outside_dhaka'],
	['Moulvibazar', 'মৌলভীবাজার', 'outside_dhaka'],
	['Habiganj', 'হবিগঞ্জ', 'outside_dhaka'],
	['Sunamganj', 'সুনামগঞ্জ', 'outside_dhaka'],
	['Rajshahi', 'রাজশাহী', 'outside_dhaka'],
	['Bogura', 'বগুড়া', 'outside_dhaka'],
	['Pabna', 'পাবনা', 'outside_dhaka'],
	['Sirajganj', 'সিরাজগঞ্জ', 'outside_dhaka'],
	['Natore', 'নাটোর', 'outside_dhaka'],
	['Joypurhat', 'জয়পুরহাট', 'outside_dhaka'],
	['Chapainawabganj', 'চাঁপাইনবাবগঞ্জ', 'outside_dhaka'],
	['Naogaon', 'নওগাঁ', 'outside_dhaka'],
	['Khulna', 'খুলনা', 'outside_dhaka'],
	['Bagerhat', 'বাগেরহাট', 'outside_dhaka'],
	['Satkhira', 'সাতক্ষীরা', 'outside_dhaka'],
	['Jashore', 'যশোর', 'outside_dhaka'],
	['Jhenaidah', 'ঝিনাইদহ', 'outside_dhaka'],
	['Magura', 'মাগুরা', 'outside_dhaka'],
	['Narail', 'নড়াইল', 'outside_dhaka'],
	['Kushtia', 'কুষ্টিয়া', 'outside_dhaka'],
	['Chuadanga', 'চুয়াডাঙ্গা', 'outside_dhaka'],
	['Meherpur', 'মেহেরপুর', 'outside_dhaka'],
	['Barishal', 'বরিশাল', 'outside_dhaka'],
	['Patuakhali', 'পটুয়াখালী', 'outside_dhaka'],
	['Bhola', 'ভোলা', 'outside_dhaka'],
	['Pirojpur', 'পিরোজপুর', 'outside_dhaka'],
	['Barguna', 'বরগুনা', 'outside_dhaka'],
	['Jhalokati', 'ঝালকাঠি', 'outside_dhaka'],
	['Rangpur', 'রংপুর', 'outside_dhaka'],
	['Dinajpur', 'দিনাজপুর', 'outside_dhaka'],
	['Kurigram', 'কুড়িগ্রাম', 'outside_dhaka'],
	['Gaibandha', 'গাইবান্ধা', 'outside_dhaka'],
	['Nilphamari', 'নীলফামারী', 'outside_dhaka'],
	['Panchagarh', 'পঞ্চগড়', 'outside_dhaka'],
	['Thakurgaon', 'ঠাকুরগাঁও', 'outside_dhaka'],
	['Lalmonirhat', 'লালমনিরহাট', 'outside_dhaka'],
	['Mymensingh', 'ময়মনসিংহ', 'outside_dhaka'],
	['Jamalpur', 'জামালপুর', 'outside_dhaka'],
	['Netrokona', 'নেত্রকোণা', 'outside_dhaka'],
	['Sherpur', 'শেরপুর', 'outside_dhaka'],
	['Faridpur', 'ফরিদপুর', 'outside_dhaka'],
	['Gopalganj', 'গোপালগঞ্জ', 'outside_dhaka'],
	['Madaripur', 'মাদারীপুর', 'outside_dhaka'],
	['Rajbari', 'রাজবাড়ী', 'outside_dhaka'],
	['Shariatpur', 'শরীয়তপুর', 'outside_dhaka'],
	['Tangail', 'টাঙ্গাইল', 'outside_dhaka'],
	['Kishoreganj', 'কিশোরগঞ্জ', 'outside_dhaka']
];

const AREAS: Record<string, string[]> = {
	Dhaka: [...INSIDE, ...SUBURBAN],
	Gazipur: ['Gazipur Sadar', 'Tongi', 'Kaliakair', 'Kapasia', 'Sreepur', 'Kaliganj'],
	Narayanganj: [
		'Narayanganj Sadar',
		'Siddhirganj',
		'Fatullah',
		'Rupganj',
		'Araihazar',
		'Sonargaon'
	],
	Chattogram: [
		'Kotwali',
		'Pahartali',
		'Panchlaish',
		'Halishahar',
		'Chandgaon',
		'Patenga',
		'Sitakunda',
		'Hathazari',
		'Rangunia',
		'Patiya',
		'Anwara',
		'Boalkhali'
	],
	Sylhet: ['Sylhet Sadar', 'Beanibazar', 'Golapganj', 'Jaintiapur', 'Companiganj', 'Zakiganj'],
	Khulna: ['Khulna Sadar', 'Sonadanga', 'Khalishpur', 'Daulatpur', 'Dumuria', 'Batiaghata'],
	Rajshahi: ['Boalia', 'Motihar', 'Rajpara', 'Shah Makhdum', 'Paba', 'Godagari'],
	Barishal: ['Barishal Sadar', 'Babuganj', 'Bakerganj', 'Banaripara', 'Gournadi'],
	Rangpur: ['Rangpur Sadar', 'Badarganj', 'Gangachara', 'Mithapukur', 'Pirgachha'],
	Mymensingh: ['Mymensingh Sadar', 'Muktagachha', 'Trishal', 'Bhaluka', 'Gafargaon']
};

const districtRows = await db
	.insert(s2.regions)
	.values(DISTRICTS.map(([name, nameBn, zone], i) => ({ name, nameBn, zone, sort: i })))
	.onConflictDoNothing()
	.returning({ id: s2.regions.id, name: s2.regions.name });

const areaValues = districtRows.flatMap((d) => {
	// Every district gets a Sadar so nowhere is unreachable at checkout.
	const list = AREAS[d.name] ?? [`${d.name} Sadar`];
	const districtZone = DISTRICTS.find(([n]) => n === d.name)?.[2] ?? 'outside_dhaka';
	return list.map((name, i) => ({
		parentId: d.id,
		name,
		zone:
			d.name === 'Dhaka'
				? SUBURBAN.includes(name)
					? ('suburban_dhaka' as const)
					: ('inside_dhaka' as const)
				: districtZone,
		sort: i
	}));
});
if (areaValues.length) await db.insert(s2.regions).values(areaValues).onConflictDoNothing();
console.log(`regions: ${districtRows.length} districts, ${areaValues.length} areas`);

await db
	.insert(s2.menus)
	.values([
		// Header stays empty on purpose: an empty header menu falls back to the
		// live category tree, which is better than a stale hardcoded list.
		{ key: 'header', tree: [] },
		{
			key: 'footer',
			tree: [
				{
					label: 'Company',
					href: '',
					children: [
						{ label: 'About us', href: '/demo/pages/about' },
						{ label: 'Contact', href: '/demo/pages/contact' },
						{ label: 'Privacy policy', href: '/demo/pages/privacy' },
						{ label: 'Terms & conditions', href: '/demo/pages/terms' }
					]
				},
				{
					label: 'My account',
					href: '',
					children: [
						{ label: 'Sign in', href: '/demo/login' },
						{ label: 'My orders', href: '/demo/account/orders' },
						{ label: 'Addresses', href: '/demo/account/addresses' },
						{ label: 'Wishlist', href: '/demo/account/wishlist' }
					]
				},
				{
					label: 'Customer service',
					href: '',
					children: [
						{ label: 'Track my order', href: '/demo/account/orders' },
						{ label: 'Blog', href: '/demo/blog' },
						{ label: 'Delivery charges', href: '/demo/pages/delivery' },
						{ label: 'Cancellation & returns', href: '/demo/pages/returns' },
						{ label: 'Payment methods', href: '/demo/pages/payment' }
					]
				}
			]
		}
	])
	.onConflictDoNothing();

/* Policy and information pages. The footer links to these, so they ship with
   real starting copy rather than 404s — the owner edits them in the CMS. */
const infoPages: [string, string, string][] = [
	[
		'about',
		'About us',
		`<p>We are an online shop serving customers across Bangladesh. We stock everyday
		groceries, home essentials, electronics and more, and we deliver nationwide.</p>
		<h2>What we care about</h2>
		<ul>
			<li><strong>Genuine products.</strong> We buy from authorised distributors and pass the brand warranty on to you.</li>
			<li><strong>Honest prices.</strong> The price you see is the price you pay. Delivery is shown before you confirm.</li>
			<li><strong>Reachable people.</strong> Every order is confirmed by phone, and you can always call us back on the same number.</li>
		</ul>
		<h2>How ordering works</h2>
		<p>Place your order on the website, or message us on WhatsApp or Messenger if that is easier.
		We call to confirm the details, pack the order, and hand it to a courier. Most deliveries
		arrive within two to five days.</p>`
	],
	[
		'contact',
		'Contact us',
		`<p>We are open from 9 AM to 10 PM, seven days a week.</p>
		<h2>Ways to reach us</h2>
		<ul>
			<li><strong>Phone.</strong> Call the number in the footer for anything urgent — an order in transit, a wrong item, a return.</li>
			<li><strong>WhatsApp or Messenger.</strong> Send us the product link and we will confirm price and stock.</li>
			<li><strong>Email.</strong> Best for anything you need in writing, such as a warranty claim.</li>
		</ul>
		<h2>Before you write</h2>
		<p>If your question is about an existing order, please have the order number ready.
		It is on your confirmation SMS and in <a href="/demo/account/orders">My orders</a>.</p>`
	],
	[
		'delivery',
		'Delivery information',
		`<h2>Where we deliver</h2>
		<p>We deliver to every district in Bangladesh. The charge depends on your area and is
		shown at checkout before you confirm — inside Dhaka is cheapest, Dhaka sub-urban next,
		and the rest of the country beyond that.</p>
		<h2>How long it takes</h2>
		<ul>
			<li><strong>Inside Dhaka:</strong> usually 1–2 days after confirmation.</li>
			<li><strong>Outside Dhaka:</strong> usually 2–5 days after confirmation.</li>
		</ul>
		<p>Large or fragile items can take longer. If anything will be delayed, we call you.</p>
		<h2>Free delivery</h2>
		<p>Some areas have a free delivery threshold. When your order qualifies, the delivery
		line shows as free at checkout.</p>
		<h2>On the day</h2>
		<p>The courier calls before arriving. Please check the parcel in front of the rider,
		and keep your phone reachable — undelivered parcels are returned to us and the order is cancelled.</p>`
	],
	[
		'returns',
		'Cancellation, returns and refunds',
		`<h2>Cancelling an order</h2>
		<p>You can cancel free of charge any time before the parcel is handed to the courier.
		Call us or reply to the confirmation message.</p>
		<h2>Returns</h2>
		<p>You may return most items within <strong>7 days</strong> of delivery if they are unused
		and in their original packaging with all accessories.</p>
		<h3>What cannot be returned</h3>
		<ul>
			<li>Food, drink and other perishable goods</li>
			<li>Personal care items that have been opened</li>
			<li>Products damaged by misuse</li>
		</ul>
		<h2>Wrong or damaged items</h2>
		<p>If we sent the wrong item, or it arrived damaged, tell us within 48 hours and we will
		collect it and replace it at our cost. Photographs help us sort it out faster.</p>
		<h2>Refunds</h2>
		<p>Once we receive and check the returned item, refunds are issued to bKash, Nagad or your
		bank account within 7 working days. For cash on delivery orders we refund the amount you paid,
		including delivery if the fault was ours.</p>`
	],
	[
		'payment',
		'Payment methods',
		`<h2>Cash on delivery</h2>
		<p>Pay the courier when your order arrives. This is available for most orders and most areas.
		Very large orders may need part payment in advance — we will tell you on the confirmation call.</p>
		<h2>Online payment</h2>
		<p>Where enabled, you can pay with bKash, Nagad, Rocket, or a Visa or Mastercard card.
		Payment is processed by our payment partner; we never see or store your card details.</p>
		<h2>Receipts</h2>
		<p>Every order comes with an invoice in the parcel, and you can view your order history
		any time in <a href="/demo/account/orders">My orders</a>.</p>`
	],
	[
		'emi',
		'EMI policy',
		`<h2>What EMI covers</h2>
		<p>Selected higher-value products can be paid in monthly instalments using an eligible
		credit card. Where EMI is available, it is shown on the product page.</p>
		<h2>Tenures</h2>
		<p>Common tenures are 3, 6, 9 and 12 months. The tenures open to you depend on your bank
		and your card limit.</p>
		<h2>Good to know</h2>
		<ul>
			<li>EMI needs a credit card from a participating bank — debit cards are not eligible.</li>
			<li>Your bank converts the transaction to EMI, and their interest and fees apply.</li>
			<li>EMI cannot be combined with cash on delivery.</li>
		</ul>
		<p>Call us before ordering if you are unsure whether your card qualifies.</p>`
	],
	[
		'privacy',
		'Privacy policy',
		`<p>This policy explains what we collect, why we collect it, and what we do with it.</p>
		<h2>What we collect</h2>
		<ul>
			<li><strong>Your contact details:</strong> name, mobile number, and delivery address.</li>
			<li><strong>Your orders:</strong> what you bought, when, and how you paid.</li>
			<li><strong>Messages:</strong> what you send us on the website or on chat apps.</li>
		</ul>
		<h2>Why we collect it</h2>
		<p>To confirm and deliver your orders, to answer your questions, and to handle returns and
		warranty claims. We use your mobile number to send order updates by SMS.</p>
		<h2>Who we share it with</h2>
		<p>Only with the people who need it to complete your order: the courier delivering your parcel,
		and the payment provider if you pay online. We do not sell your data.</p>
		<h2>How long we keep it</h2>
		<p>We keep order records for as long as we need them for accounting and warranty purposes.
		You can ask us to delete your account details at any time.</p>
		<h2>Your choices</h2>
		<p>Contact us to see, correct or delete the information we hold about you.</p>`
	],
	[
		'terms',
		'Terms and conditions',
		`<h2>Orders</h2>
		<p>Placing an order is an offer to buy. The order is confirmed once we have spoken to you
		and accepted it. We may decline an order if the item is out of stock, the price was listed
		in error, or the delivery address is outside our service area.</p>
		<h2>Prices and stock</h2>
		<p>Prices include VAT where applicable and can change without notice. We try hard to keep
		stock accurate, but if an item sells out after you order, we will call you and refund or
		substitute it with your agreement.</p>
		<h2>Delivery</h2>
		<p>Delivery times are estimates, not guarantees. See our <a href="/demo/pages/delivery">delivery
		information</a> for details.</p>
		<h2>Returns</h2>
		<p>Returns are governed by our <a href="/demo/pages/returns">cancellation, returns and refunds
		policy</a>.</p>
		<h2>Warranty</h2>
		<p>Warranty is provided by the brand or its authorised service centre. We help you make the
		claim, but the terms are the manufacturer's.</p>
		<h2>Contact</h2>
		<p>Questions about these terms? <a href="/demo/pages/contact">Get in touch</a>.</p>`
	]
];

for (const [slug, title, body] of infoPages) {
	await db
		.insert(s2.pages)
		.values({
			slug,
			title,
			published: true,
			seoTitle: title,
			blocks: [
				{
					id: crypto.randomUUID(),
					type: 'richText',
					props: { heading: title, body: body.replace(/\n\t*/g, ' ').trim(), width: 'narrow' }
				}
			]
		})
		.onConflictDoNothing({ target: s2.pages.slug });
}
console.log(`pages: ${infoPages.length} information pages`);

/** Default homepage — the same sections the storefront shipped with, as blocks. */
const b = (type: string, props: Record<string, unknown>) => ({
	id: crypto.randomUUID(),
	type,
	props
});

await db
	.insert(s2.pages)
	.values({
		slug: 'home',
		title: 'Home',
		published: true,
		blocks: [
			// Section order mirrors the reference storefront. Banner blocks ship
			// empty — they render nothing until images are added, so the page stays
			// clean while the structure is already in place to fill.
			b('categoryStrip', { limit: 12 }),
			b('heroSplit', {
				slides: [
					{
						image: 'https://picsum.photos/seed/hero-1/1400/600',
						href: '/demo/search',
						alt: 'Season sale'
					},
					{
						image: 'https://picsum.photos/seed/hero-2/1400/600',
						href: '/demo/search?sort=popular',
						alt: 'Top picks this week'
					},
					{
						image: 'https://picsum.photos/seed/hero-3/1400/600',
						href: '/demo/c/electronics',
						alt: 'Electronics offers'
					}
				],
				tiles: [
					{
						image: 'https://picsum.photos/seed/tile-1/600/300',
						href: '/demo/c/electronics',
						alt: 'Flash sale'
					},
					{
						image: 'https://picsum.photos/seed/tile-2/600/300',
						href: '/demo/c/sports-outdoor',
						alt: 'Ride more, save more'
					},
					{
						image: 'https://picsum.photos/seed/tile-3/300/300',
						href: '/demo/c/home-living',
						alt: 'Furniture deals'
					},
					{
						image: 'https://picsum.photos/seed/tile-4/300/300',
						href: '/demo/c/fashion',
						alt: 'Handicraft picks'
					}
				],
				interval: 5,
				aspect: '16 / 7',
				layout: '1+1+2'
			}),
			b('policyStrip', {
				items: [
					{
						icon: 'RotateCcw',
						title: 'Cancellation & Returns',
						subtitle: 'Free returns within 7 days',
						href: '/demo/pages/returns'
					},
					{
						icon: 'ShieldCheck',
						title: 'Genuine Products',
						subtitle: 'Brand warranty on everything',
						href: '/demo/pages/privacy'
					},
					{
						icon: 'Truck',
						title: 'Fast Delivery',
						subtitle: 'Nationwide in 2-5 days',
						href: '/demo/pages/delivery'
					},
					{
						icon: 'Headphones',
						title: 'Customer Support',
						subtitle: 'Call us 9 AM - 10 PM',
						href: '/demo/pages/contact'
					}
				]
			}),
			b('banner', {
				slides: [
					{
						image: 'https://picsum.photos/seed/banner-flash/1400/260',
						href: '/demo/search',
						alt: 'Flash sale'
					}
				],
				heading: '',
				subtitle: '',
				cta: '',
				background: 'none',
				aspect: '16 / 5',
				contained: true,
				interval: 6
			}),
			b('hotDeals', {
				heading: 'Hot Deals of the Day',
				href: '/demo/search',
				source: { mode: 'rule', rule: 'hot-deal', categoryId: '', ids: [], limit: 10 },
				countdownTo: ''
			}),
			b('bannerGrid', {
				banners: [
					{
						image: 'https://picsum.photos/seed/bg-1/700/300',
						href: '/demo/search?sort=newest',
						alt: 'New arrivals'
					},
					{
						image: 'https://picsum.photos/seed/bg-2/700/300',
						href: '/demo/c/sports-outdoor',
						alt: 'Save on rides'
					},
					{
						image: 'https://picsum.photos/seed/bg-3/460/300',
						href: '/demo/c/beauty-health',
						alt: 'Fresh picks'
					},
					{
						image: 'https://picsum.photos/seed/bg-4/460/300',
						href: '/demo/c/electronics',
						alt: 'Best price challenge'
					},
					{
						image: 'https://picsum.photos/seed/bg-5/460/300',
						href: '/demo/c/home-living',
						alt: 'Home picks'
					}
				],
				layout: '2+3',
				background: 'soft'
			}),
			b('productSection', {
				heading: 'Trending Products',
				href: '/demo/search?sort=popular',
				source: { mode: 'rule', rule: 'best-seller', categoryId: '', ids: [], limit: 5 },
				columns: '5',
				cardSize: 'standard'
			}),
			b('banner', {
				slides: [
					{
						image: 'https://picsum.photos/seed/band-grocery/700/320',
						href: '/demo/c/grocery-foods',
						alt: 'Grocery and foods'
					}
				],
				heading: 'Grocery and Foods',
				subtitle: 'Bringing fresh to your doorstep — free delivery on orders over ৳500.',
				cta: 'Shop groceries',
				background: 'brand',
				aspect: '3 / 1',
				contained: false,
				interval: 6
			}),
			b('productSection', {
				heading: 'Featured',
				href: '/demo/search',
				source: { mode: 'rule', rule: 'featured', categoryId: '', ids: [], limit: 5 },
				columns: '5',
				cardSize: 'standard'
			}),
			b('productSection', {
				heading: 'New Arrivals',
				href: '/demo/search?sort=newest',
				source: { mode: 'rule', rule: 'new-arrival', categoryId: '', ids: [], limit: 5 },
				columns: '5',
				cardSize: 'standard'
			}),
			b('productSection', {
				heading: 'Top Rated',
				href: '/demo/search?sort=rating',
				source: { mode: 'rule', rule: 'top-rated', categoryId: '', ids: [], limit: 5 },
				columns: '5',
				cardSize: 'standard'
			}),
			b('productSection', {
				heading: 'Best Sellers',
				href: '/demo/search?sort=popular',
				source: { mode: 'rule', rule: 'best-seller', categoryId: '', ids: [], limit: 5 },
				columns: '5',
				cardSize: 'standard'
			}),
			b('banner', {
				slides: [
					{
						image: 'https://picsum.photos/seed/band-app/700/320',
						href: '/demo/search',
						alt: 'Shop smarter'
					}
				],
				heading: 'Shop smarter, live better',
				subtitle: 'Thousands of products, cash on delivery, nationwide.',
				cta: 'Start shopping',
				background: 'ink',
				aspect: '3 / 1',
				contained: true,
				interval: 6
			}),
			b('productGrid', {
				heading: 'Recommended for you',
				href: '/demo/search',
				source: { mode: 'rule', rule: 'best-seller', categoryId: '', ids: [], limit: 20 },
				columns: '5'
			}),
			b('brands', { heading: 'Top Weekly Brands', limit: 8 }),
			b('contactBand', {
				heading: 'Questions? Talk to a real person.',
				subtitle: 'Call or message us and we will help you place the order — no account needed.',
				chatLabel: 'Order on WhatsApp'
			})
		]
	})
	.onConflictDoNothing({ target: s2.pages.slug });

/* Demo data — SEED_DEMO=1 pnpm db:seed. Gives the dashboard something to draw. */
if (process.env.SEED_DEMO) {
	const names = [
		'Rahim Uddin',
		'Nusrat Jahan',
		'Tanvir Ahmed',
		'Sadia Islam',
		'Imran Hossain',
		'Farhana Akter',
		'Jamil Rahman',
		'Sumaiya Haque',
		'Arif Chowdhury',
		'Mitu Barua',
		'Shahriar Kabir',
		'Ruma Begum'
	];
	const cities = [
		['Dhaka', 'inside_dhaka'],
		['Chattogram', 'outside_dhaka'],
		['Sylhet', 'outside_dhaka'],
		['Khulna', 'outside_dhaka'],
		['Gazipur', 'suburban_dhaka'],
		['Narayanganj', 'suburban_dhaka']
	] as const;
	const streets = ['Road 12, Banani', 'Zindabazar', 'GEC Circle', 'Sonadanga', 'Tongi Bazar'];
	/* Four months of trading, busier at weekends and heavier lately, so the
	   dashboard and the Insights window have a shape rather than a flat line.
	   Old orders are settled; recent ones are still moving. */
	const rows = [];
	for (let day = 119; day >= 0; day--) {
		const created0 = new Date(Date.now() - day * 864e5);
		const weekend = [5, 6].includes(created0.getDay());
		const growth = 1 + (119 - day) / 160;
		const count = Math.round((weekend ? 5 : 3) * growth * (0.5 + Math.random()));

		for (let n = 0; n < count; n++) {
			const created = new Date(Date.now() - day * 864e5 - n * 36e5);
			const [city, zone] = cities[Math.floor(Math.random() * cities.length)];
			const subtotal = (Math.floor(Math.random() * 90) + 5) * 10000;
			const shipping = zone === 'inside_dhaka' ? 6000 : 12000;
			// A parcel sent yesterday cannot already be delivered and returned.
			const settled = ['delivered', 'delivered', 'delivered', 'returned', 'cancelled'] as const;
			const moving = ['pending', 'confirmed', 'packed', 'shipped'] as const;
			const status =
				day > 10
					? settled[Math.floor(Math.random() * settled.length)]
					: moving[Math.floor(Math.random() * moving.length)];

			rows.push({
				number: `${created.toISOString().slice(2, 10).replace(/-/g, '')}-${String(rows.length + 1).padStart(4, '0')}`,
				name: names[Math.floor(Math.random() * names.length)],
				phone: `018${Math.floor(10000000 + Math.random() * 89999999)}`,
				address: {
					zone,
					city,
					line: streets[Math.floor(Math.random() * streets.length)]
				},
				zone,
				subtotal,
				shipping,
				total: subtotal + shipping,
				// A tenth pay online, which is about right for this market.
				paymentMethod: (Math.random() > 0.9 ? 'sslcommerz' : 'cod') as 'cod' | 'sslcommerz',
				paymentStatus: (status === 'delivered' ? 'paid' : 'unpaid') as 'paid' | 'unpaid',
				status,
				createdAt: created
			});
		}
	}
	await db.insert(s2.orders).values(rows).onConflictDoNothing();
	console.log(`demo: ${rows.length} orders`);

	/* Catalog: enough breadth that every homepage row and grid fills up. */
	const img = (seed: string, w = 700, h = 700) => `https://picsum.photos/seed/${seed}/${w}/${h}`;
	const pick = <T>(list: readonly T[]) => list[Math.floor(Math.random() * list.length)];
	const PRICE_BANDS: Record<string, [number, number]> = {
		'Grocery & Foods': [40, 900],
		'Home & Living': [400, 8000],
		Electronics: [1500, 30000],
		'Mobile & Gadgets': [500, 25000],
		Fashion: [400, 4500],
		'Beauty & Health': [90, 1200],
		'Baby & Toys': [150, 5000],
		'Sports & Outdoor': [300, 18000]
	};

	const between = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

	const catalog = [
		{
			name: 'Grocery & Foods',
			bn: 'মুদি ও খাবার',
			brands: ['PRAN', 'Teer', 'Fresh', 'Rupchanda', 'ACI', 'Radhuni'],
			items: [
				'Minicate Rice 5kg',
				'Soyabean Oil 5L',
				'Atta 2kg',
				'Mustard Oil 1L',
				'Sugar 1kg',
				'Red Lentil 1kg',
				'Salt 1kg',
				'Semai 200gm',
				'Chinigura Rice 2kg',
				'Ghee 500gm',
				'Tea Leaf 400gm',
				'Powder Milk 1kg'
			]
		},
		{
			name: 'Home & Living',
			bn: 'ঘর ও গৃহস্থালি',
			brands: ['RFL', 'Sera', 'Otobi', 'Hatil', 'Regal'],
			items: [
				'Water Tank 500L',
				'Dinner Set 36 Pcs',
				'Arm Chair',
				'Thermal Ice Box 25L',
				'Storage Rack 4 Shelf',
				'Plastic Wardrobe',
				'Study Table',
				'Foldable Bed',
				'Clothes Drying Stand',
				'Shoe Rack 3 Layer',
				'Center Table',
				'Book Shelf'
			]
		},
		{
			name: 'Electronics',
			bn: 'ইলেকট্রনিক্স',
			brands: ['Philips', 'VISION', 'Walton', 'Gazi', 'Singer', 'Miyako'],
			items: [
				'Air Fryer 3.2L',
				'Rice Cooker 3.0L',
				'Infrared Cooker 2200W',
				'Blender 2 in 1',
				'Electric Kettle 1.8L',
				'Induction Cooker',
				'Sandwich Maker',
				'Hand Mixer',
				'Water Purifier 23L',
				'Iron Dry',
				'Toaster 2 Slice',
				'Juicer 400W'
			]
		},
		{
			name: 'Mobile & Gadgets',
			bn: 'মোবাইল ও গ্যাজেট',
			brands: ['Xiaomi', 'Realme', 'Samsung', 'Havit', 'Baseus'],
			items: [
				'Wireless Earbuds',
				'Power Bank 20000mAh',
				'Smart Watch',
				'Bluetooth Speaker',
				'Fast Charger 33W',
				'USB-C Cable 2m',
				'Phone Stand',
				'Selfie Stick',
				'Wireless Mouse',
				'Mechanical Keyboard',
				'Laptop Bag',
				'Screen Protector'
			]
		},
		{
			name: 'Fashion',
			bn: 'ফ্যাশন',
			brands: ['Winner', 'Aarong', 'Yellow', 'Ecstasy', 'Le Reve'],
			items: [
				'Cotton Panjabi',
				'Formal Shirt',
				'Denim Jeans',
				'Casual T-Shirt',
				'Saree Jamdani',
				'Salwar Kameez Set',
				'Kids Frock',
				'Winter Jacket',
				'Leather Belt',
				'Sports Shoes',
				'Sandal Leather',
				'Cap Baseball'
			]
		},
		{
			name: 'Beauty & Health',
			bn: 'বিউটি ও হেলথ',
			brands: ['Kumarika', 'Meril', 'Himalaya', 'Lifebuoy', 'Vaseline'],
			items: [
				'Hair Oil 200ml',
				'Face Wash 100ml',
				'Body Lotion 200ml',
				'Shampoo 340ml',
				'Soap Bar 100gm',
				'Toothpaste 200gm',
				'Hand Sanitizer 500ml',
				'Petroleum Jelly 100ml',
				'Face Cream 50gm',
				'Talcum Powder 200gm',
				'Shaving Foam',
				'Hair Serum'
			]
		},
		{
			name: 'Baby & Toys',
			bn: 'বেবি ও খেলনা',
			brands: ['Playtime', 'Pampers', 'Huggies', 'Fisher Price'],
			items: [
				'Baby Diaper Pants L',
				'Baby Wipes 80 Pcs',
				'Feeding Bottle 250ml',
				'Baby Walker',
				'Toy Car Set',
				'Building Blocks 100 Pcs',
				'Soft Teddy Bear',
				'Kids Slide',
				'Rocking Horse',
				'Baby Bath Tub',
				'Puzzle Board',
				'Colouring Set'
			]
		},
		{
			name: 'Sports & Outdoor',
			bn: 'খেলাধুলা',
			brands: ['Duranta', 'Veloce', 'Cosco', 'Nivia'],
			items: [
				'Mountain Bicycle 26"',
				'Kids Bicycle 20"',
				'Cricket Bat',
				'Football Size 5',
				'Yoga Mat 6mm',
				'Dumbbell Set 10kg',
				'Skipping Rope',
				'Badminton Racket',
				'Camping Tent 4 Person',
				'Water Bottle 1L',
				'Helmet Cycling',
				'Gym Gloves'
			]
		}
	] as const;

	const catRows = await db
		.insert(s2.categories)
		.values(
			catalog.map((c, i) => ({
				name: c.name,
				nameBn: null,
				slug: slugify(c.name),
				image: img(`cat-${slugify(c.name)}`, 200, 200),
				sort: i,
				visible: true
			}))
		)
		.onConflictDoNothing({ target: s2.categories.slug })
		.returning({ id: s2.categories.id, slug: s2.categories.slug });

	const catBySlug = new Map(catRows.map((c) => [c.slug, c.id]));

	/* A shop with a hundred products looks like a demo. Every brand carries a
	   slice of the category's items, and some lines come in more than one size,
	   which is how a real catalogue reaches several hundred SKUs without
	   inventing several hundred names. */
	const VARIANTS: Record<string, string[]> = {
		'Grocery & Foods': ['', ' — Family pack', ' — Economy pack'],
		'Home & Living': ['', ' — Large', ' — Small'],
		Electronics: ['', ' — 2024 model'],
		'Mobile & Gadgets': ['', ' — Black', ' — White'],
		Fashion: ['', ' — M', ' — L', ' — XL'],
		'Beauty & Health': ['', ' — Twin pack'],
		'Baby & Toys': ['', ' — Gift box'],
		'Sports & Outdoor': ['', ' — Pro']
	};

	const productValues = catalog.flatMap((cat) =>
		cat.brands.flatMap((brand) =>
			cat.items.flatMap((item) =>
				(VARIANTS[cat.name] ?? ['']).map((suffix) => {
					const title = `${brand} ${item}${suffix}`;
					// Price band per category — groceries are not Tk 15,000.
					const [lo, hi] = PRICE_BANDS[cat.name] ?? [200, 3000];
					const price = between(lo, hi) * 100;
					const hasDiscount = Math.random() > 0.25;
					return {
						categorySlug: slugify(cat.name),
						title,
						slug: slugify(title),
						brand,
						status: 'active' as const,
						price,
						compareAtPrice: hasDiscount ? Math.round(price * (1 + between(5, 45) / 100)) : null,
						stock: between(0, 60),
						featured: Math.random() > 0.7,
						rating: between(30, 50),
						reviewCount: between(0, 240),
						soldCount: between(0, 900),
						description: `${title}. Genuine product with brand warranty, delivered anywhere in Bangladesh. Cash on delivery available.`
					};
				})
			)
		)
	);

	const inserted = await db
		.insert(s2.products)
		.values(productValues.map(({ categorySlug, ...p }) => p))
		.onConflictDoNothing({ target: s2.products.slug })
		.returning({ id: s2.products.id, slug: s2.products.slug });

	const idBySlug = new Map(inserted.map((p) => [p.slug, p.id]));

	const links = productValues
		.map((p) => ({ productId: idBySlug.get(p.slug), categoryId: catBySlug.get(p.categorySlug) }))
		.filter((l): l is { productId: string; categoryId: string } => !!l.productId && !!l.categoryId);
	if (links.length) await db.insert(s2.productCategories).values(links).onConflictDoNothing();

	const images = productValues.flatMap((p) => {
		const id = idBySlug.get(p.slug);
		return id
			? [0, 1, 2].map((sort) => ({ productId: id, url: img(`${p.slug}-${sort}`), sort }))
			: [];
	});
	if (images.length) await db.insert(s2.productImages).values(images);

	console.log(`demo: ${catRows.length} categories, ${inserted.length} products`);

	/* Demo threads so the inbox is not an empty screen on first run. */
	const threads = [
		{
			channel: 'whatsapp' as const,
			externalId: '8801712345678',
			name: 'Rahim Uddin',
			phone: '01712345678',
			msgs: [
				['in', 'Assalamu alaikum. Ei rice ta ki stock ache?'],
				['out', 'Walaikum assalam! Yes, it is in stock. Would you like us to reserve one?']
			]
		},
		{
			channel: 'messenger' as const,
			externalId: 'psid_8891220034',
			name: 'Nusrat Jahan',
			phone: '01812345678',
			msgs: [['in', 'Dhaka er baire delivery charge koto?']]
		},
		{
			channel: 'site' as const,
			externalId: null,
			name: 'Tanvir Ahmed',
			phone: '01912345678',
			msgs: [['in', 'My order was supposed to arrive yesterday. Any update?']]
		},
		{
			channel: 'telegram' as const,
			externalId: 'tg_9931',
			name: 'Shirin Akter',
			phone: '01612345678',
			// Arrived from a product page, so the thread knows what it is about.
			fromProduct: true,
			msgs: [['in', 'Eta ki original? Warranty ache?']]
		}
	];

	for (const t of threads) {
		const [conv] = await db
			.insert(s2.conversations)
			.values({
				channel: t.channel,
				externalId: t.externalId,
				name: t.name,
				phone: t.phone,
				unread: true
			})
			.onConflictDoNothing()
			.returning({ id: s2.conversations.id });
		if (!conv) continue;

		// Attach the product the demo thread came from.
		if ((t as { fromProduct?: boolean }).fromProduct) {
			const [p] = await db
				.select({ id: s2.products.id })
				.from(s2.products)
				.where(eq(s2.products.status, 'active'))
				.limit(1);
			if (p)
				await db
					.update(s2.conversations)
					.set({ productId: p.id })
					.where(eq(s2.conversations.id, conv.id));
		}

		for (const [dir, body] of t.msgs)
			await db.insert(s2.messages).values({
				conversationId: conv.id,
				inbound: dir === 'in',
				author: dir === 'in' ? 'customer' : 'staff',
				authorName: dir === 'in' ? t.name : 'Owner',
				body: body as string
			});
	}
	console.log(`demo: ${threads.length} conversations`);

	/* Reviews and questions. Ratings alone left the product tabs empty, which
	   made the demo store look broken rather than new. */
	// A wide sample, so reviews and interest spread across the catalogue rather
	// than pooling on the first hundred products.
	const productRows = await db.select({ id: s2.products.id }).from(s2.products).limit(400);

	const reviewTitles = [
		'Exactly as described',
		'Good value for the price',
		'Delivery was quick',
		'Packaging could be better',
		'Buying again',
		'Works well so far'
	] as const;
	const reviewBodies = [
		'Ordered on Sunday and it reached Dhaka on Tuesday. The product is genuine, box was sealed.',
		'Using it for two weeks now, no problem. The price here was lower than the showroom.',
		'Product is fine but the carton was slightly dented. The delivery man waited while I checked.',
		'Bought this for my mother and she is happy with it. Cash on delivery made it easy.',
		'Quality is good for the money. Would have liked a longer warranty.',
		'Second time ordering from this shop. They called to confirm before sending.'
	] as const;
	const askerNames = ['Rahim', 'Sumaiya', 'Tanvir', 'Nusrat', 'Imran', 'Farhana', 'Jamil'] as const;
	const questionTexts = [
		'Is cash on delivery available outside Dhaka?',
		'How many days for delivery to Chattogram?',
		'Is this the original one or a copy?',
		'Does it come with a warranty card?',
		'Can I exchange it if the size does not fit?',
		'Is there any discount for two pieces?'
	] as const;
	const answerTexts = [
		'Yes, cash on delivery works anywhere in Bangladesh.',
		'Two to five days outside Dhaka, one to two days inside.',
		'It is genuine, supplied by the authorised distributor.',
		'Yes, the warranty card is inside the box.'
	] as const;

	const reviewValues = productRows.flatMap((p) =>
		Array.from({ length: between(0, 4) }, () => {
			const stars = between(3, 5);
			return {
				productId: p.id,
				authorName: pick(askerNames),
				rating: stars,
				title: pick(reviewTitles),
				body: pick(reviewBodies),
				// Most are published; a few wait, so the admin has something to do.
				approved: Math.random() > 0.15
			};
		})
	);
	if (reviewValues.length) await db.insert(s2.productReviews).values(reviewValues);

	const questionValues = productRows.flatMap((p) =>
		Array.from({ length: between(0, 2) }, () => {
			const answered = Math.random() > 0.4;
			return {
				productId: p.id,
				authorName: pick(askerNames),
				question: pick(questionTexts),
				answer: answered ? pick(answerTexts) : null,
				answeredAt: answered ? new Date() : null
			};
		})
	);
	if (questionValues.length) await db.insert(s2.productQuestions).values(questionValues);

	/* Order lines. The demo orders are written before the catalogue exists, so
	   they start empty — which left best sellers, "customers also bought" and
	   every revenue figure at zero. Fill them in now that products are here, and
	   move the order totals to match what is actually on them. */
	const orderRows = await db
		.select({ id: s2.orders.id, shipping: s2.orders.shipping })
		.from(s2.orders);
	const priced = await db
		.select({ id: s2.products.id, title: s2.products.title, price: s2.products.price })
		.from(s2.products)
		.limit(200);

	let lineCount = 0;
	for (const order of orderRows) {
		const [{ n }] = await db
			.select({ n: count() })
			.from(s2.orderItems)
			.where(eq(s2.orderItems.orderId, order.id));
		if (n > 0) continue;

		// One to three distinct products, so co-purchase has something to count.
		const chosen = new Map<string, (typeof priced)[number]>();
		for (let i = 0; i < between(1, 3); i++) {
			const p = pick(priced);
			chosen.set(p.id, p);
		}

		const lines = [...chosen.values()].map((p) => ({
			orderId: order.id,
			productId: p.id,
			title: p.title,
			unitPrice: p.price,
			qty: between(1, 2)
		}));
		await db.insert(s2.orderItems).values(lines);
		lineCount += lines.length;

		const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.qty, 0);
		await db
			.update(s2.orders)
			.set({ subtotal, total: subtotal + order.shipping })
			.where(eq(s2.orders.id, order.id));
	}
	/* Blog posts. A new shop with an empty blog looks abandoned, and these are
	   the three questions this market actually asks before it buys. */
	const [author] = await db.select({ id: s2.adminUsers.id }).from(s2.adminUsers).limit(1);
	const articles = [
		{
			slug: 'cash-on-delivery-how-it-works',
			title: 'Cash on delivery: how it works, and why we ask you to check the parcel',
			titleBn: 'ক্যাশ অন ডেলিভারি কীভাবে কাজ করে',
			excerpt:
				'You pay the courier at your door, not us in advance. Here is what happens between your order and that moment — and what to do if the box is not right.',
			tags: ['delivery', 'how we work'],
			body: `<p>Most orders here are paid at the door. You order, we call to confirm, the courier brings it, and you hand over the money then. Nothing is taken from you before that.</p>
<h2>What happens after you order</h2>
<p>You get an SMS with your order number straight away. Within a few working hours somebody calls to confirm the address and the phone number — this call is the reason so few of our parcels come back, so please pick up.</p>
<p>Inside Dhaka the parcel usually reaches you the next day. Outside Dhaka it is two to five days, depending on where you are.</p>
<h2>Check the parcel before you pay</h2>
<p>The courier will wait while you open the box. Look for three things: the right product, the right quantity, and no damage. If something is wrong, do not pay — hand it straight back and call us. That costs you nothing.</p>
<p>Once you have paid and the courier has gone, a wrong item becomes a return, which takes days. Thirty seconds at the door saves all of it.</p>
<h2>When cash on delivery is not offered</h2>
<p>Very large orders sometimes need part payment in advance. If that applies to yours, we will say so on the confirmation call — never afterwards, and never by SMS asking you to send money to a personal number. We will never ask for that.</p>`
		},
		{
			slug: 'choosing-a-rice-cooker',
			title: 'Choosing a rice cooker: capacity, inner pot, and what the wattage really tells you',
			titleBn: 'রাইস কুকার কেনার আগে',
			excerpt:
				'Three things decide whether you are happy with a rice cooker two years from now. Price is not one of them.',
			tags: ['buying guide', 'kitchen'],
			body: `<h2>Start with capacity, not price</h2>
<p>Cooker capacity is measured in dry litres, and a litre of dry rice feeds roughly four people. A 1.8 litre cooker suits a family of four to six. A 2.8 works for a household that cooks once for the whole day.</p>
<p>Buying larger than you need is not free: a half-empty pot cooks unevenly, and the rice at the top stays firm.</p>
<h2>The inner pot is the part that wears out</h2>
<p>A thin pressed-aluminium pot with a sprayed coating will lose that coating within a year of daily scrubbing. A thicker pot, or one with a hard-anodised layer, costs a little more and outlasts the cooker.</p>
<p>Whatever you buy, wash the pot with a soft sponge. A steel scourer takes the coating off in weeks, and no warranty covers that.</p>
<h2>Wattage tells you speed, not quality</h2>
<p>A 700W cooker and a 1000W cooker of the same size cook the same rice. The larger one gets there faster and draws more from your line while it does. In a house where several things run at once, the lower-wattage model is often the easier neighbour.</p>
<h2>Before you order</h2>
<p>Check that the lid seal is removable — a fixed seal traps starch and starts to smell. Check that a spare inner pot is available. And check the warranty covers the pot, not only the body; most do not, and it is worth knowing before rather than after.</p>`
		},
		{
			slug: 'genuine-or-copy',
			title: 'Genuine or copy: how to tell before you pay',
			titleBn: 'আসল না নকল, বুঝবেন যেভাবে',
			excerpt:
				'The copies have got good. These are the checks that still work at the door, in half a minute.',
			tags: ['buying guide', 'how we work'],
			body: `<p>Nearly every question we get in the inbox is a version of this one, so here is the honest answer: a good copy can look right in a photograph. What it usually cannot do is survive four small checks at the door.</p>
<h2>The box</h2>
<p>Print quality is where copies fail first. Look at the smallest text on the box — the certification marks and the address. On a genuine box it is sharp; on a copy it is soft or slightly doubled.</p>
<h2>The seal</h2>
<p>A factory seal is even and centred. A resealed box has a seal that is slightly off, or two layers of tape.</p>
<h2>The serial</h2>
<p>Most brands let you check a serial number on their own website or by SMS. Do it while the courier is there, not afterwards.</p>
<h2>The weight</h2>
<p>Copies are usually lighter. If you have handled the genuine article before, you will feel it immediately.</p>
<h2>What we do about it</h2>
<p>We buy from the authorised distributor and the warranty card in the box is the manufacturer's, not ours. If anything you receive from us turns out not to be genuine, send it back and we refund it in full — that is not a favour, it is the deal.</p>`
		}
	];

	const postValues = articles.map((a) => ({
		...a,
		authorId: author?.id ?? null,
		published: true,
		publishedAt: new Date(),
		seoTitle: null,
		seoDescription: a.excerpt
	}));
	await db.insert(s2.posts).values(postValues).onConflictDoNothing({ target: s2.posts.slug });
	console.log(`demo: ${postValues.length} blog posts`);

	/* What shoppers looked for and looked at. Without this the Insights screen
	   is three empty panels, which tells an owner nothing about what it is for.
	   Some terms deliberately match nothing — that is the panel worth reading. */
	const searched = [
		['rice cooker', 40],
		['kettle', 32],
		['air fryer', 28],
		['baby diaper', 24],
		['mustard oil', 22],
		['school bag', 12],
		['iphone 15 pro', 0],
		['washing machine', 0],
		['ac 1.5 ton', 0],
		['sewing machine', 0]
	] as const;

	const searchRows = searched.flatMap(([term, results]) =>
		Array.from({ length: between(4, 30) }, () => ({
			term,
			results: results === 0 ? 0 : between(1, results),
			createdAt: new Date(Date.now() - between(0, 29) * 864e5)
		}))
	);
	await db.insert(s2.searchQueries).values(searchRows);

	const eventRows = productRows.flatMap((p) => [
		...Array.from({ length: between(0, 40) }, () => ({
			productId: p.id,
			kind: 'view' as const,
			createdAt: new Date(Date.now() - between(0, 29) * 864e5)
		})),
		...Array.from({ length: between(0, 6) }, () => ({
			productId: p.id,
			kind: 'cart' as const,
			createdAt: new Date(Date.now() - between(0, 29) * 864e5)
		}))
	]);
	// Written in batches: a single insert of tens of thousands of rows is a
	// parameter limit waiting to happen.
	for (let i = 0; i < eventRows.length; i += 2000)
		await db.insert(s2.productEvents).values(eventRows.slice(i, i + 2000));

	console.log(`demo: ${searchRows.length} searches, ${eventRows.length} product events`);

	console.log(`demo: ${lineCount} order lines`);

	console.log(`demo: ${reviewValues.length} reviews, ${questionValues.length} questions`);
}

console.log(`seeded — admin: ${email} / ${password}`);
process.exit(0);
