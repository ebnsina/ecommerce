import type { Handle } from '@sveltejs/kit';
import { validateSession, readSessionCookie } from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
	const token = readSessionCookie(event);
	event.locals.user = token ? await validateSession(token) : null;
	return resolve(event);
};
