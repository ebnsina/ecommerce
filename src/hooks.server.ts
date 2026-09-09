import { error, redirect, type Handle } from '@sveltejs/kit';
import { validateSession, readSessionCookie } from '$lib/server/auth';
import { SHOP } from '$lib/paths';

/**
 * Security headers.
 *
 * The Content-Security-Policy is deliberately not here: SvelteKit generates it
 * from `kit.csp` in the config, where it can hash the inline scripts it emits
 * itself. Setting one by hand here would either break hydration or be so loose
 * it means nothing.
 */
const SECURITY_HEADERS: Record<string, string> = {
	// Stops a browser guessing that an uploaded .txt is really a script.
	'x-content-type-options': 'nosniff',
	// The shop is never framed. Nothing here is meant to be embedded, and this
	// is what stops an invisible overlay collecting clicks on a real button.
	'x-frame-options': 'DENY',
	// A referrer to our own origin is useful; sending a full URL to a third
	// party is a leak — an order confirmation URL is a good example.
	'referrer-policy': 'strict-origin-when-cross-origin',
	// Nothing in this shop needs any of these, so nothing embedded gets them.
	'permissions-policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
	'cross-origin-opener-policy': 'same-origin'
};

export const handle: Handle = async ({ event, resolve }) => {
	const token = readSessionCookie(event);
	event.locals.user = token ? await validateSession(token) : null;

	const { pathname } = event.url;

	/**
	 * /admin is closed to anyone without a staff session.
	 *
	 * The guard lives here rather than in the admin layout because a layout
	 * `load` does not run before a form action: guarding there left every admin
	 * action — saving a product, deleting a coupon, changing settings —
	 * reachable by an unauthenticated POST, even though the pages themselves
	 * redirected to login.
	 */
	if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
		if (event.locals.user?.kind !== 'admin') {
			// A form post gets a flat refusal; a page navigation gets sent to the
			// login screen and back again afterwards.
			if (event.request.method !== 'GET') error(403, 'Sign in first.');
			redirect(303, `/admin/login?next=${encodeURIComponent(pathname)}`);
		}
	}

	/**
	 * The demo is behind the door, not through it.
	 *
	 * Someone who has not left a number sees the form and nothing else — the
	 * same reason the admin guard lives here rather than in a layout: a layout
	 * `load` does not run before a form action, so a gate there would let an
	 * unanswered visitor post to the cart. The cookie is set the moment the
	 * form is accepted, and lasts a year, so this is asked once.
	 *
	 * `/demo/hello` is the door itself, and the API routes underneath are for
	 * webhooks and callbacks that no visitor drives.
	 */
	if (pathname.startsWith(SHOP) && !pathname.startsWith(`${SHOP}/hello`)) {
		if (!event.cookies.get('lead')) {
			if (event.request.method !== 'GET') error(403, 'Leave your number first.');
			redirect(303, `${SHOP}/hello?next=${encodeURIComponent(pathname + event.url.search)}`);
		}
	}

	/**
	 * A shopper's own pages need a shopper. The account layout's `load` guards
	 * the pages, but — the same lesson as /admin above — it does not run before
	 * a form action, so saving an address was reachable without a session.
	 */
	if (pathname.startsWith(`${SHOP}/account`) && event.locals.user?.kind !== 'customer') {
		if (event.request.method !== 'GET') error(403, 'Sign in first.');
		redirect(303, `${SHOP}/login?next=${encodeURIComponent(pathname)}`);
	}

	const response = await resolve(event);

	for (const [header, value] of Object.entries(SECURITY_HEADERS))
		response.headers.set(header, value);

	// Told only to browsers that already arrived over TLS, so a plain-HTTP
	// development server is unaffected.
	if (event.url.protocol === 'https:')
		response.headers.set('strict-transport-security', 'max-age=31536000; includeSubDomains');

	// Nothing under /admin or a shopper's own account should sit in a shared
	// cache, or be there for the next person on the machine.
	if (pathname.startsWith('/admin') || pathname.startsWith(`${SHOP}/account`))
		response.headers.set('cache-control', 'private, no-store');

	return response;
};
