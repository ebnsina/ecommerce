/**
 * One shop event, reported to every ad platform that is switched on.
 *
 * Callers describe what happened in our own words; each vendor's naming is a
 * detail of this file. Adding a platform means adding one entry to `VENDORS`
 * and one payload function beside it — no page is touched.
 *
 * Money is integer poisha everywhere in this codebase and every vendor wants
 * decimal major units, so the conversion happens here, once, at the boundary.
 */
export type ShopEvent = {
	kind: 'view_item' | 'add_to_cart' | 'begin_checkout' | 'purchase' | 'search';
	/** Poisha. */
	value?: number;
	items?: { id: string; name?: string; price?: number; quantity: number }[];
	/** Purchase only. The dedup key against the server-side event is built from it. */
	orderId?: string;
	/** Purchase only. The human-facing number, which is what reads well in reports. */
	orderNumber?: string;
	searchTerm?: string;
};

export type PixelIds = {
	metaPixelId?: string;
	tiktokPixelId?: string;
	gtmId?: string;
	ga4Id?: string;
};

const CURRENCY = 'BDT';

/** The deduplication key for a purchase. Both the browser and the server derive
    it from the order id, so neither has to pass the other any state. */
export const purchaseEventId = (orderId: string) => `purchase.${orderId}`;

const taka = (poisha: number | undefined) =>
	poisha === undefined ? undefined : +(poisha / 100).toFixed(2);

/* ── Payloads ────────────────────────────────────────────────────────────────
   Pure, so the shapes each vendor expects can be tested without a browser. */

const META_EVENTS = {
	view_item: 'ViewContent',
	add_to_cart: 'AddToCart',
	begin_checkout: 'InitiateCheckout',
	purchase: 'Purchase',
	search: 'Search'
} as const;

/** TikTok renamed CompletePayment to Purchase in May 2025; the old names still
    work but new setups are expected to use these. */
const TIKTOK_EVENTS = {
	view_item: 'ViewContent',
	add_to_cart: 'AddToCart',
	begin_checkout: 'InitiateCheckout',
	purchase: 'Purchase',
	search: 'Search'
} as const;

/** Google names events in snake_case and shares them between GA4 and GTM. */
const GOOGLE_EVENTS = {
	view_item: 'view_item',
	add_to_cart: 'add_to_cart',
	begin_checkout: 'begin_checkout',
	purchase: 'purchase',
	search: 'search'
} as const;

export const metaProps = (e: ShopEvent) => ({
	currency: CURRENCY,
	...(e.value !== undefined ? { value: taka(e.value) } : {}),
	...(e.items
		? {
				content_type: 'product',
				contents: e.items.map((i) => ({
					id: i.id,
					quantity: i.quantity,
					item_price: taka(i.price)
				}))
			}
		: {}),
	...(e.searchTerm ? { search_string: e.searchTerm } : {})
});

export const tiktokProps = (e: ShopEvent) => ({
	currency: CURRENCY,
	...(e.value !== undefined ? { value: taka(e.value) } : {}),
	...(e.items
		? {
				content_type: 'product',
				contents: e.items.map((i) => ({
					content_id: i.id,
					content_name: i.name,
					quantity: i.quantity,
					price: taka(i.price)
				}))
			}
		: {}),
	...(e.searchTerm ? { search_string: e.searchTerm } : {})
});

/** GA4 and GTM take the same ecommerce block; only the delivery differs. */
export const googleParams = (e: ShopEvent) => ({
	currency: CURRENCY,
	...(e.value !== undefined ? { value: taka(e.value) } : {}),
	...(e.orderNumber || e.orderId ? { transaction_id: e.orderNumber ?? e.orderId } : {}),
	...(e.searchTerm ? { search_term: e.searchTerm } : {}),
	...(e.items
		? {
				items: e.items.map((i) => ({
					item_id: i.id,
					item_name: i.name,
					price: taka(i.price),
					quantity: i.quantity
				}))
			}
		: {})
});

/* ── Vendors ─────────────────────────────────────────────────────────────── */

const w = () => window as any;

function load(src: string) {
	const s = document.createElement('script');
	s.async = true;
	s.src = src;
	document.head.appendChild(s);
}

type Vendor = {
	key: keyof PixelIds;
	/** Loads the vendor's script. Called once, only when an ID is configured. */
	boot: (id: string) => void;
	/** A page view. Empty where the vendor tracks navigation on its own. */
	page: () => void;
	send: (e: ShopEvent, id: string) => void;
};

const meta: Vendor = {
	key: 'metaPixelId',
	boot(id) {
		const q: any = (w().fbq = function (...args: unknown[]) {
			q.callMethod ? q.callMethod.apply(q, args) : q.queue.push(args);
		});
		w()._fbq ??= q;
		q.push = q;
		q.loaded = true;
		q.version = '2.0';
		q.queue = [];
		load('https://connect.facebook.net/en_US/fbevents.js');
		w().fbq('init', id);
	},
	page: () => w().fbq?.('track', 'PageView'),
	send: (e) =>
		w().fbq?.(
			'track',
			META_EVENTS[e.kind],
			metaProps(e),
			// Pairs with the server-side Conversions API event, so one order is
			// counted once however many of the two arrive.
			e.orderId ? { eventID: purchaseEventId(e.orderId) } : undefined
		)
};

const tiktok: Vendor = {
	key: 'tiktokPixelId',
	boot(id) {
		// TikTok's snippet is a method-queue stub of the same shape as Meta's:
		// every call is buffered until events.js replaces it.
		const methods = [
			'page',
			'track',
			'identify',
			'instances',
			'debug',
			'on',
			'off',
			'once',
			'ready',
			'alias',
			'group',
			'enableCookie',
			'disableCookie'
		];
		w().TiktokAnalyticsObject = 'ttq';
		const ttq: any = (w().ttq = w().ttq || []);
		ttq.methods = methods;
		ttq.setAndDefer = (t: any, e: string) => {
			t[e] = (...args: unknown[]) => t.push([e, ...args]);
		};
		for (const m of methods) ttq.setAndDefer(ttq, m);
		ttq._i = { [id]: [] };
		ttq._i[id]._u = 'https://analytics.tiktok.com/i18n/pixel/events.js';
		ttq._t = { [id]: +new Date() };
		ttq._o = { [id]: {} };
		load(
			`https://analytics.tiktok.com/i18n/pixel/events.js?sdkid=${encodeURIComponent(id)}&lib=ttq`
		);
	},
	page: () => w().ttq?.page?.(),
	send: (e) =>
		// The dedup id is TikTok's third argument, not a property.
		w().ttq?.track?.(
			TIKTOK_EVENTS[e.kind],
			tiktokProps(e),
			e.orderId ? { event_id: purchaseEventId(e.orderId) } : undefined
		)
};

const gtm: Vendor = {
	key: 'gtmId',
	boot(id) {
		w().dataLayer = w().dataLayer || [];
		w().dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
		load(`https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(id)}`);
	},
	page: () => w().dataLayer?.push({ event: 'page_view', page_path: location.pathname }),
	send(e) {
		// Google's own instruction: clear the previous ecommerce object first, or
		// values from the last event leak into this one.
		w().dataLayer?.push({ ecommerce: null });
		w().dataLayer?.push({ event: GOOGLE_EVENTS[e.kind], ecommerce: googleParams(e) });
	}
};

const ga4: Vendor = {
	key: 'ga4Id',
	boot(id) {
		w().dataLayer = w().dataLayer || [];
		// Google's snippet pushes the Arguments object itself, not an array.
		w().gtag = function () {
			w().dataLayer.push(arguments);
		};
		load(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`);
		w().gtag('js', new Date());
		w().gtag('config', id);
	},
	// Nothing here: GA4's enhanced measurement counts history changes itself, and
	// a manual page_view on top of that doubles every session's page count.
	page: () => {},
	send: (e) => w().gtag?.('event', GOOGLE_EVENTS[e.kind], googleParams(e))
};

const VENDORS: Vendor[] = [meta, tiktok, gtm, ga4];

/* Set once by the shop layout, so a page firing an event does not have to be
   handed IDs it has no other use for. */
let configured: PixelIds = {};
const booted = new Set<string>();

/** Boots whatever is switched on. Safe to call repeatedly; each vendor loads once. */
export function bootPixels(ids: PixelIds) {
	if (typeof window === 'undefined') return;
	configured = ids;
	for (const v of VENDORS) {
		const id = ids[v.key];
		if (!id || booted.has(v.key)) continue;
		booted.add(v.key);
		v.boot(id);
	}
}

export function trackPage() {
	if (typeof window === 'undefined') return;
	for (const v of VENDORS) if (configured[v.key]) v.page();
}

/** A no-op when nothing is configured, so callers never have to check. */
export function track(e: ShopEvent) {
	if (typeof window === 'undefined') return;
	for (const v of VENDORS) if (configured[v.key]) v.send(e, configured[v.key]!);
}
