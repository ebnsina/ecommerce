import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

/**
 * The signed-in staff member, for the pages to render.
 *
 * Access itself is decided in hooks.server.ts, which sees form actions too — a
 * layout load does not run before one.
 */
export const load: LayoutServerLoad = async ({ locals, url }) => {
	const admin = locals.user?.kind === 'admin' ? locals.user : null;
	if (admin && url.pathname === '/admin/login') redirect(303, '/admin');
	return { admin };
};
