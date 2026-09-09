/**
 * Who may look at an order.
 *
 * Order numbers are readable over the phone — `260907-0041` — which also makes
 * them guessable in a loop, so the number is not a secret and cannot be the
 * only thing standing between a stranger and a buyer's name, mobile and home
 * address. A signed-in customer proves it by owning the row; a guest, who has
 * no account by design, proves it with a cookie set on the browser that placed
 * the order.
 *
 * The cookie holds the order's id, not a flag: a visitor can set any cookie
 * they like in their own browser, and a flag keyed on the public order number
 * would be forged as easily as the number is guessed. The id is a random uuid
 * nobody outside the order ever sees.
 */
import type { RequestEvent } from '@sveltejs/kit';

const cookieName = (number: string) => `o_${number.replace(/[^\w-]/g, '')}`;

/** Called the moment an order is placed, before the redirect to it. */
export function rememberOrder(event: RequestEvent, order: { id: string; number: string }) {
	event.cookies.set(cookieName(order.number), order.id, {
		path: '/',
		maxAge: 60 * 60 * 24 * 30,
		httpOnly: true,
		sameSite: 'lax',
		secure: !import.meta.env.DEV
	});
}

export function ownsOrder(
	event: RequestEvent,
	order: { id: string; number: string; customerId: string | null }
): boolean {
	if (
		order.customerId &&
		event.locals.user?.kind === 'customer' &&
		event.locals.user.id === order.customerId
	)
		return true;
	return event.cookies.get(cookieName(order.number)) === order.id;
}
