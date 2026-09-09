import { fail, redirect } from '@sveltejs/kit';
import { saveLead } from '$lib/server/leads';
import { SHOP } from '$lib/paths';
import type { Actions } from './$types';

/** A year: long enough that a returning visitor is never asked twice. */
const REMEMBER = {
	path: '/',
	maxAge: 60 * 60 * 24 * 365,
	httpOnly: true,
	sameSite: 'lax'
} as const;

/**
 * Where the demo asks who is looking.
 *
 * The form lives in a dialog over the shop, but its action lives here so it
 * works without JavaScript: the dialog posts to this route and comes back, and
 * anyone landing on the page directly gets the same form full width.
 */
export const actions: Actions = {
	save: async ({ request, cookies, getClientAddress }) => {
		const f = await request.formData();
		const back = String(f.get('redirectTo') ?? SHOP);

		const result = await saveLead(
			{
				name: String(f.get('name') ?? ''),
				phone: String(f.get('phone') ?? ''),
				shopName: String(f.get('shopName') ?? ''),
				sells: String(f.get('sells') ?? ''),
				sellsOn: String(f.get('sellsOn') ?? ''),
				source: String(f.get('source') ?? 'demo')
			},
			getClientAddress()
		);

		if (!result.ok) return fail(400, { error: result.error, field: result.field });

		cookies.set('lead', 'given', REMEMBER);
		redirect(303, back.startsWith('/') ? back : SHOP);
	},

	/* Not now. The same cookie, so the question is asked once either way — a
	   dialog that reappears on every page is the fastest way to lose the visit. */
	skip: async ({ request, cookies }) => {
		const f = await request.formData();
		const back = String(f.get('redirectTo') ?? SHOP);
		cookies.set('lead', 'skipped', REMEMBER);
		redirect(303, back.startsWith('/') ? back : SHOP);
	}
};
