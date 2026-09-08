/**
 * Abandoned cart recovery.
 *
 * A cart counts as abandoned when it still holds items, we know whose it is
 * (the phone is captured at the first checkout step), and it has sat untouched
 * for longer than the delay set in Settings. Placing an order empties the cart,
 * so a bought cart can never look abandoned.
 */
import { and, eq, isNotNull, isNull, lt, sql } from 'drizzle-orm';
import { SHOP } from '$lib/paths';
import { db } from './db';
import { carts } from './db/schema';
import { getSettings } from './settings';
import { sendSms } from './sms';

export type AbandonedCart = {
	id: string;
	token: string;
	phone: string;
	name: string | null;
	items: number;
	value: number;
	updatedAt: Date;
	remindedAt: Date | null;
};

/** `before` is the cutoff — carts touched more recently are still live. */
export async function abandonedCarts(before: Date, onlyUnreminded = false) {
	const rows = await db
		.select({
			id: carts.id,
			token: carts.token,
			phone: carts.phone,
			name: carts.name,
			updatedAt: carts.updatedAt,
			remindedAt: carts.remindedAt,
			items: sql<number>`(select coalesce(sum(ci.qty), 0) from cart_items ci
				where ci.cart_id = carts.id)`,
			value: sql<number>`(select coalesce(sum(
				coalesce(ci.unit_price, v.price, p.price) * ci.qty), 0)
				from cart_items ci
				join products p on p.id = ci.product_id
				left join variants v on v.id = ci.variant_id
				where ci.cart_id = carts.id)`
		})
		.from(carts)
		.where(
			and(
				isNotNull(carts.phone),
				lt(carts.updatedAt, before),
				onlyUnreminded ? isNull(carts.remindedAt) : undefined
			)
		)
		.orderBy(sql`carts.updated_at desc`)
		.limit(200);

	// A cart whose items were all removed is not abandoned, it is empty.
	return rows.filter((r) => Number(r.items) > 0) as AbandonedCart[];
}

/** Fills the placeholders an owner can use in the reminder text. */
export function renderMessage(
	template: string,
	vars: { name: string; items: number; store: string; link: string }
) {
	return template
		.replaceAll('{name}', vars.name)
		.replaceAll('{items}', vars.items === 1 ? '1 item' : `${vars.items} items`)
		.replaceAll('{store}', vars.store)
		.replaceAll('{link}', vars.link)
		.trim();
}

export async function sendReminder(cart: AbandonedCart, origin: string) {
	// Claim the cart first. Cron delivery can fire the same scheduled run twice,
	// and two runs picking up the same cart would text the shopper twice; the
	// conditional update means only one of them wins.
	const claimed = await db
		.update(carts)
		.set({ remindedAt: new Date() })
		.where(and(eq(carts.id, cart.id), isNull(carts.remindedAt)))
		.returning({ id: carts.id });
	// A cart being reminded again by hand has a stamp already, so an empty
	// result only blocks the automatic path.
	if (!claimed.length && !cart.remindedAt) return false;

	const settings = await getSettings();
	const text = renderMessage(settings.recovery.message, {
		name: cart.name?.split(' ')[0] ?? 'Hi',
		items: Number(cart.items),
		store: settings.store.name,
		link: `${origin}${SHOP}/cart/resume/${cart.token}`
	});
	const ok = await sendSms(cart.phone, text);
	// Stamped whatever happens — on the claim above for an automatic send, here
	// for a manual one — so a broken gateway cannot spam one shopper.
	await db.update(carts).set({ remindedAt: new Date() }).where(eq(carts.id, cart.id));
	return ok;
}
