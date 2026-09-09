import { fail, redirect } from '@sveltejs/kit';
import { eq, sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { addresses, carts, customers, orders } from '$lib/server/db/schema';
import { findCart, getLines, summarise } from '$lib/server/cart';
import { applyCoupon, shippingFor, placeOrder } from '$lib/server/orders';
import { rememberOrder } from '$lib/server/orderAccess';
import { getSettings } from '$lib/server/settings';
import { getRegions, resolveZone } from '$lib/server/regions';
import { normalizePhone } from '$lib/phone';
import { sendSms } from '$lib/server/sms';
import { capiConfigured, purchaseEventId, sendEvents } from '$lib/server/meta';
import { createSession, paymentConfigured } from '$lib/server/payments';
import { consume } from '$lib/server/ratelimit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const cart = await findCart(event);
	const lines = cart ? await getLines(cart.id) : [];
	if (!lines.length) redirect(303, '/demo/cart');

	const { subtotal, problems } = summarise(lines);
	if (problems.length) redirect(303, '/demo/cart');

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

		const result = await applyCoupon(String(form.get('code') ?? ''), subtotal, shipping, {
			customerId: event.locals.user?.kind === 'customer' ? event.locals.user.id : null,
			phone: cart.phone
		});
		if (!result.ok) return fail(400, { couponError: result.error });
		return { coupon: { code: result.code, discount: result.discount, label: result.label } };
	},

	/** Stores who the cart belongs to, so an abandoned one can be followed up.
	    Silent by design: a failure here must never block checkout. */
	identify: async (event) => {
		const form = await event.request.formData();
		const phone = normalizePhone(String(form.get('phone') ?? ''));
		const cart = await findCart(event);
		if (!phone || !cart) return { identified: false };

		await db
			.update(carts)
			.set({ phone, name: String(form.get('name') ?? '').trim() || null, remindedAt: null })
			.where(eq(carts.id, cart.id));
		return { identified: true };
	},

	place: async (event) => {
		// Each order sends an SMS and burns a number from the day's sequence, so
		// a script must not be able to place them in a loop.
		const limit = await consume(`place:${event.getClientAddress()}`, 10, 3600);
		if (!limit.ok) return fail(429, { error: 'Too many orders from here. Try again later.' });

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
		const settings = await getSettings();

		// Only offer what the shop has switched on: a form can be posted with
		// anything in it.
		const asked = String(form.get('paymentMethod') ?? 'cod');
		const method: 'cod' | 'sslcommerz' =
			asked === 'sslcommerz' && settings.payment.sslcommerz && paymentConfigured()
				? 'sslcommerz'
				: 'cod';

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
			paymentMethod: method,
			couponCode: String(form.get('couponCode') ?? '') || null,
			note: String(form.get('note') ?? '').trim() || null
		});

		if (!result.ok) return fail(400, { error: result.error });

		// This browser placed it, so this browser may read it back.
		rememberOrder(event, result);

		// Name the account after the first order so staff have something to call them.
		if (customerId && !name)
			await db.update(customers).set({ name }).where(eq(customers.id, customerId));

		// The total is computed during placement — coupons and delivery are
		// applied there — so it is read back rather than recomputed here. Both
		// the ad reporting and the payment session need it.
		const [placed] = await db
			.select({ total: orders.total })
			.from(orders)
			.where(eq(orders.id, result.id))
			.limit(1);

		// Server-side Purchase, deduplicated against the browser pixel on the
		// confirmation page by a shared event_id. Ad blockers never see this one.
		const pixelId = settings.analytics?.metaPixelId;
		if (capiConfigured(pixelId)) {
			await sendEvents(
				pixelId!,
				[
					{
						name: 'Purchase',
						eventId: purchaseEventId(result.id),
						sourceUrl: event.url.href,
						value: placed?.total ?? 0,
						contents: lines.map((l) => ({
							id: l.productId,
							quantity: l.qty,
							item_price: +(l.unitPrice / 100).toFixed(2)
						}))
					}
				],
				{
					phone,
					firstName: name.split(' ')[0],
					lastName: name.split(' ').slice(1).join(' ') || null,
					city: place.district,
					fbp: event.cookies.get('_fbp'),
					fbc: event.cookies.get('_fbc'),
					ip: event.getClientAddress(),
					userAgent: event.request.headers.get('user-agent')
				}
			);
		}

		await sendSms(
			phone,
			`Order ${result.number} received. We will call you shortly to confirm. Thank you!`
		);

		/* Paying online means one more hop: the order exists and is unpaid, and
		   the gateway sends the shopper back to /checkout/payment/…, which is
		   where it actually gets marked paid. A session that cannot be created
		   is not a lost order — it falls through to the confirmation page with
		   the order sitting there unpaid, and staff can call. */
		if (method === 'sslcommerz' && paymentConfigured()) {
			const session = await createSession({
				orderId: result.id,
				orderNumber: result.number,
				total: placed?.total ?? 0,
				name,
				phone,
				// Customers here sign in by phone; the gateway only wants a
				// syntactically valid address, so the adapter supplies a filler.
				email: null,
				address: { line, city: place.district!, area: place.area ?? undefined },
				items: lines.map((l) => ({ title: l.title, unitPrice: l.unitPrice, qty: l.qty })),
				origin: event.url.origin
			});
			if ('url' in session) redirect(303, session.url);
			console.error('[checkout] payment session failed', session.error);
		}

		redirect(303, `/demo/order/${result.number}`);
	}
};
