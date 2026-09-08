import { fail } from '@sveltejs/kit';
import { getSettings } from '$lib/server/settings';
import { abandonedCarts, sendReminder } from '$lib/server/recovery';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const { recovery } = await getSettings();
	// Shown from the moment a cart goes quiet, whatever the reminder delay is —
	// the owner should see them building up even with reminders switched off.
	const before = new Date(Date.now() - recovery.delayHours * 3600_000);
	const list = await abandonedCarts(before);

	return {
		list,
		recovery,
		value: list.reduce((n, c) => n + Number(c.value), 0)
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
