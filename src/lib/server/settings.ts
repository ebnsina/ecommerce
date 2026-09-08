import { inArray } from 'drizzle-orm';
import { db } from './db';
import { settings } from './db/schema';

export type StoreSettings = {
	store: {
		name: string;
		phone: string;
		email: string;
		supportHours: string;
		/** Wordmark or uploaded image — the shop picks one. */
		logo: { mode: 'text' | 'image'; text: string; image: string | null };
	};
	auth: { otpEnabled: boolean; otpTtlMinutes: number; maxAttempts: number };
	delivery: Record<string, { label: string; charge: number; freeAbove: number }>;
	payment: { cod: boolean; sslcommerz: boolean; codMaxOrder: number };
	social: { facebook: string; instagram: string; youtube: string };
	contact: { whatsapp: string; messenger: string; callEnabled: boolean };
	footer: { paymentMethods: { name: string; logo: string }[]; note: string };
	/** Reassurance list on every product page. */
	assurances: { icon: string; title: string; note: string }[];
	/** Rotating hints typed out in the header search box. */
	search: { hints: string[] };
	theme: { preset: string; surface: string };
	analytics: {
		metaPixelId: string;
		tiktokPixelId: string;
		gtmId: string;
		ga4Id: string;
	};
	recovery: { enabled: boolean; delayHours: number; message: string };
	promo: {
		text: string;
		textBn: string;
		href: string;
		active: boolean;
		dismissible: boolean;
		background: string;
	};
};

const FALLBACK: StoreSettings = {
	store: {
		name: 'Store',
		phone: '',
		email: '',
		supportHours: '',
		logo: { mode: 'text', text: '', image: null }
	},
	auth: { otpEnabled: true, otpTtlMinutes: 5, maxAttempts: 5 },
	delivery: {},
	payment: { cod: true, sslcommerz: false, codMaxOrder: 5000000 },
	social: { facebook: '', instagram: '', youtube: '' },
	contact: { whatsapp: '', messenger: '', callEnabled: true },
	footer: { paymentMethods: [], note: '' },
	assurances: [],
	search: { hints: [] },
	theme: { preset: 'blue', surface: 'white' },
	analytics: { metaPixelId: '', tiktokPixelId: '', gtmId: '', ga4Id: '' },
	recovery: {
		enabled: false,
		delayHours: 6,
		message: '{name}, you left {items} in your cart at {store}. Finish your order here: {link}'
	},
	promo: { text: '', textBn: '', href: '', active: false, dismissible: true, background: 'ink' }
};

/** Reads the whole settings table — it is a handful of rows, not worth a cache. */
export async function getSettings(): Promise<StoreSettings> {
	const rows = await db.select().from(settings);
	const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
	return { ...FALLBACK, ...map } as StoreSettings;
}
