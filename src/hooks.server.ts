import { error, redirect, type Handle } from '@sveltejs/kit';
import { validateSession, readSessionCookie } from '$lib/server/auth';

/**
 * Every request carries whoever it belongs to, and /admin is closed to anyone
 * else.
 *
 * The guard lives here rather than in the admin layout because a layout `load`
 * does not run before a form action: guarding there left every admin action —
 * saving a product, deleting a coupon, changing settings — reachable by an
 * unauthenticated POST, even though the pages themselves redirected to login.
 */
export const handle: Handle = async ({ event, resolve }) => {
	const token = readSessionCookie(event);
	event.locals.user = token ? await validateSession(token) : null;

	const { pathname } = event.url;
	if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
		if (event.locals.user?.kind !== 'admin') {
			// A form post gets a flat refusal; a page navigation gets sent to the
			// login screen and back again afterwards.
			if (event.request.method !== 'GET') error(403, 'Sign in first.');
			redirect(303, `/admin/login?next=${encodeURIComponent(pathname)}`);
		}
	}

	return resolve(event);
};
