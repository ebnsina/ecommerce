import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

/** Everything under /admin needs a staff session, except the login page. */
export const load: LayoutServerLoad = async ({ locals, url }) => {
	const isLogin = url.pathname === '/admin/login';
	const admin = locals.user?.kind === 'admin' ? locals.user : null;

	if (!admin && !isLogin) redirect(303, `/admin/login?next=${encodeURIComponent(url.pathname)}`);
	if (admin && isLogin) redirect(303, '/admin');

	return { admin };
};
