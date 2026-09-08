import { fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { settings } from '$lib/server/db/schema';
import { getSettings } from '$lib/server/settings';
import { parseTk } from '$lib/money';
import { normalizeTheme } from '$lib/theme';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => ({ settings: await getSettings() });

/** Upsert one settings key. Each form section saves independently. */
async function put(key: string, value: unknown) {
	await db
		.insert(settings)
		.values({ key, value })
		.onConflictDoUpdate({ target: settings.key, set: { value } });
}

const str = (f: FormData, k: string) => String(f.get(k) ?? '').trim();
const on = (f: FormData, k: string) => f.get(k) === 'on';

export const actions: Actions = {
	store: async ({ request }) => {
		const f = await request.formData();
		const mode = str(f, 'logoMode') === 'image' ? 'image' : 'text';
		await put('store', {
			name: str(f, 'name') || 'Store',
			phone: str(f, 'phone'),
			email: str(f, 'email'),
			supportHours: str(f, 'supportHours'),
			logo: { mode, text: str(f, 'logoText'), image: str(f, 'logoImage') || null }
		});
		return { saved: 'store' };
	},

	promo: async ({ request }) => {
		const f = await request.formData();
		await put('promo', {
			text: str(f, 'text'),
			textBn: str(f, 'textBn'),
			href: str(f, 'href'),
			active: on(f, 'active'),
			dismissible: on(f, 'dismissible'),
			background: str(f, 'background') || 'ink'
		});
		return { saved: 'promo' };
	},

	delivery: async ({ request }) => {
		const f = await request.formData();
		const zones = ['inside_dhaka', 'suburban_dhaka', 'outside_dhaka'] as const;
		const labels: Record<string, string> = {
			inside_dhaka: 'Inside Dhaka',
			suburban_dhaka: 'Dhaka Sub-urban',
			outside_dhaka: 'Outside Dhaka'
		};

		try {
			await put(
				'delivery',
				Object.fromEntries(
					zones.map((z) => [
						z,
						{
							label: str(f, `${z}_label`) || labels[z],
							charge: parseTk(str(f, `${z}_charge`) || '0'),
							freeAbove: parseTk(str(f, `${z}_free`) || '0')
						}
					])
				)
			);
		} catch (e) {
			return fail(400, { error: (e as Error).message });
		}
		return { saved: 'delivery' };
	},

	payment: async ({ request }) => {
		const f = await request.formData();
		try {
			await put('payment', {
				cod: on(f, 'cod'),
				sslcommerz: on(f, 'sslcommerz'),
				codMaxOrder: parseTk(str(f, 'codMaxOrder') || '0')
			});
		} catch (e) {
			return fail(400, { error: (e as Error).message });
		}
		return { saved: 'payment' };
	},

	auth: async ({ request }) => {
		const f = await request.formData();
		await put('auth', {
			otpEnabled: on(f, 'otpEnabled'),
			otpTtlMinutes: Math.min(30, Math.max(1, Number(f.get('otpTtlMinutes')) || 5)),
			maxAttempts: Math.min(10, Math.max(3, Number(f.get('maxAttempts')) || 5))
		});
		return { saved: 'auth' };
	},

	contact: async ({ request }) => {
		const f = await request.formData();
		await put('contact', {
			whatsapp: str(f, 'whatsapp'),
			messenger: str(f, 'messenger'),
			callEnabled: on(f, 'callEnabled')
		});
		return { saved: 'contact' };
	},

	recovery: async ({ request }) => {
		const f = await request.formData();
		const hours = Number(str(f, 'delayHours'));
		await put('recovery', {
			enabled: on(f, 'enabled'),
			// Under an hour is nagging; over a week the cart is cold.
			delayHours: Number.isFinite(hours) ? Math.min(168, Math.max(1, Math.round(hours))) : 6,
			message: str(f, 'message')
		});
		return { saved: 'recovery' };
	},

	analytics: async ({ request }) => {
		const f = await request.formData();
		// Digits only: the id is interpolated into the pixel snippet.
		await put('analytics', { metaPixelId: str(f, 'metaPixelId').replace(/\D/g, '') });
		return { saved: 'analytics' };
	},

	theme: async ({ request }) => {
		const f = await request.formData();
		// normalizeTheme rejects anything not in the preset list, so a hand-posted
		// value cannot inject arbitrary CSS into every page.
		await put('theme', normalizeTheme({ preset: str(f, 'preset'), surface: str(f, 'surface') }));
		return { saved: 'theme' };
	},

	assurances: async ({ request }) => {
		const f = await request.formData();
		const rows = JSON.parse(String(f.get('assurances') ?? '[]'));
		await put(
			'assurances',
			(Array.isArray(rows) ? rows : [])
				.filter((r) => r?.title?.trim())
				.map((r) => ({
					icon: String(r.icon || 'Truck'),
					title: String(r.title).trim(),
					note: String(r.note ?? '').trim()
				}))
		);
		return { saved: 'assurances' };
	},

	footer: async ({ request }) => {
		const f = await request.formData();
		const methods = JSON.parse(String(f.get('paymentMethods') ?? '[]'));
		await put('footer', {
			paymentMethods: (Array.isArray(methods) ? methods : []).map(String).filter(Boolean),
			note: str(f, 'note')
		});
		return { saved: 'footer' };
	},

	search: async ({ request }) => {
		const f = await request.formData();
		const hints = JSON.parse(String(f.get('hints') ?? '[]'));
		await put('search', {
			hints: (Array.isArray(hints) ? hints : []).map(String).filter(Boolean)
		});
		return { saved: 'search' };
	},

	social: async ({ request }) => {
		const f = await request.formData();
		await put('social', {
			facebook: str(f, 'facebook'),
			instagram: str(f, 'instagram'),
			youtube: str(f, 'youtube')
		});
		return { saved: 'social' };
	}
};
