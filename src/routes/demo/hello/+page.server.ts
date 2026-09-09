import { fail, redirect } from '@sveltejs/kit';
import { saveLead } from '$lib/server/leads';
import { SHOP } from '$lib/paths';
import type { Actions } from './$types';

/** A year: long enough that a returning visitor is never asked twice. */
const REMEMBER = {
	path: '/',
	maxAge: 60 * 60 * 24 * 365,
	httpOnly: true,
	sameSite: 'lax',
	secure: !import.meta.env.DEV
} as const;

/**
 * The door to the demo.
 *
 * Everything under /demo is closed until this form is answered (see
 * hooks.server.ts), so this is the first thing a visitor sees and the only
 * page they can reach. `next` carries where they were heading, so a link
 * straight to a product still lands on that product afterwards.
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
	}
};
