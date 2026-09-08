import { fail } from '@sveltejs/kit';
import { getSettings } from '$lib/server/settings';
import { abandonedCarts, sendReminder } from '$lib/server/recovery';
import { listParams } from '$lib/admin/listQuery';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const { q, page, perPage } = listParams(url);
	const { recovery } = await getSettings();
	// Shown from the moment a cart goes quiet, whatever the reminder delay is —
	// the owner should see them building up even with reminders switched off.
	const before = new Date(Date.now() - recovery.delayHours * 3600_000);
	const all = await abandonedCarts(before);

	// The set is capped at 200 rows by the query, so searching and paging it
	// here costs nothing and keeps one code path for both.
	const needle = q.toLowerCase();
	const list = needle
		? all.filter((c) => c.phone.includes(needle) || (c.name ?? '').toLowerCase().includes(needle))
		: all;

	return {
		rows: list.slice((page - 1) * perPage, page * perPage),
		total: list.length,
		page,
		perPage,
		recovery,
		value: list.reduce((n, c) => n + Number(c.value), 0),
		filters: { q }
	};
};

export const actions: Actions = {
	remind: async ({ request, url }) => {
		const form = await request.formData();
		const id = String(form.get('id') ?? '');
		const { recovery } = await getSettings();
		const [cart] = (await abandonedCarts(new Date())).filter((c) => c.id === id);
		if (!cart) return fail(404, { error: 'That cart is no longer waiting.' });

		const ok = await sendReminder(cart, url.origin);
		return ok
			? { sent: cart.phone }
			: fail(502, { error: 'The SMS gateway refused the message. Check Connections.' });
	}
};
