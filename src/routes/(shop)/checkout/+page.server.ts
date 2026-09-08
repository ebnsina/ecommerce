import { fail, redirect } from '@sveltejs/kit';
import { eq, sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { addresses, customers } from '$lib/server/db/schema';
import { findCart, getLines, summarise } from '$lib/server/cart';
import { applyCoupon, shippingFor, placeOrder } from '$lib/server/orders';
import { getSettings } from '$lib/server/settings';
import { getRegions, resolveZone } from '$lib/server/regions';
import { normalizePhone } from '$lib/phone';
import { sendSms } from '$lib/server/sms';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const cart = await findCart(event);
	const lines = cart ? await getLines(cart.id) : [];
	if (!lines.length) redirect(303, '/cart');

	const { subtotal, problems } = summarise(lines);
	if (problems.length) redirect(303, '/cart');

	const [settings, regions] = await Promise.all([getSettings(), getRegions()]);
	const customerId = event.locals.user?.kind === 'customer' ? event.locals.user.id : null;

	const saved = customerId
		? await db
				.select()
				.from(addresses)
				.where(eq(addresses.customerId, customerId))
				.orderBy(sql`${addresses.isDefault} desc`)
		: [];

	return {
		lines,
		subtotal,
		addresses: saved,
		regions,
		phone: event.locals.user?.kind === 'customer' ? event.locals.user.phone : '',
		name: event.locals.user?.kind === 'customer' ? (event.locals.user.name ?? '') : '',
		zones: Object.entries(settings.delivery).map(([value, z]) => ({
			value,
			label: z.label,
			charge: z.charge,
			freeAbove: z.freeAbove
		})),
		payment: settings.payment
	};
};

export const actions: Actions = {
	/** Live coupon check — the same code runs again at placement. */
	coupon: async (event) => {
		const form = await event.request.formData();
		const cart = await findCart(event);
		if (!cart) return fail(400, { error: 'Your cart has expired.' });

		const lines = await getLines(cart.id);
		const { subtotal } = summarise(lines);
		// Same resolution as placement, so the previewed discount matches the order.
		const place = await resolveZone(
			String(form.get('districtId') ?? '') || null,
			String(form.get('areaId') ?? '') || null
		);
		const shipping = await shippingFor(place?.zone ?? 'outside_dhaka', subtotal);

		const result = await applyCoupon(String(form.get('code') ?? ''), subtotal, shipping);
		if (!result.ok) return fail(400, { couponError: result.error });
		return { coupon: { code: result.code, discount: result.discount, label: result.label } };
	},

	place: async (event) => {
		const form = await event.request.formData();
		const cart = await findCart(event);
		if (!cart) return fail(400, { error: 'Your cart has expired.' });

		const lines = await getLines(cart.id);
		if (!lines.length) return fail(400, { error: 'Your cart is empty.' });

		const phone = normalizePhone(String(form.get('phone') ?? ''));
		const name = String(form.get('name') ?? '').trim();
		const line = String(form.get('line') ?? '').trim();

		// The zone is resolved from the chosen place, never taken from the form —
		// otherwise a shopper could post `inside_dhaka` and underpay delivery.
		const place = await resolveZone(
			String(form.get('districtId') ?? '') || null,
			String(form.get('areaId') ?? '') || null
		);

		if (!name) return fail(400, { error: 'Enter the name for delivery.' });
		if (!phone) return fail(400, { error: 'Enter a valid Bangladeshi mobile number.' });
		if (!place) return fail(400, { error: 'Choose your district.' });
		if (!line) return fail(400, { error: 'Enter the full delivery address.' });

		const customerId = event.locals.user?.kind === 'customer' ? event.locals.user.id : null;

		const result = await placeOrder({
			cartId: cart.id,
			customerId,
			lines,
			name,
			phone,
			address: {
				zone: place.zone,
				city: place.district!,
				area: place.area ?? undefined,
				line
			},
			paymentMethod: String(form.get('paymentMethod') ?? 'cod') as 'cod' | 'sslcommerz',
			couponCode: String(form.get('couponCode') ?? '') || null,
			note: String(form.get('note') ?? '').trim() || null
		});

		if (!result.ok) return fail(400, { error: result.error });

		// Name the account after the first order so staff have something to call them.
		if (customerId && !name)
			await db.update(customers).set({ name }).where(eq(customers.id, customerId));

		await sendSms(
			phone,
			`Order ${result.number} received. We will call you shortly to confirm. Thank you!`
		);

		redirect(303, `/order/${result.number}`);
	}
};
