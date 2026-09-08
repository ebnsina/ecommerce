import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	if (locals.user?.kind !== 'customer')
		redirect(303, `/login?next=${encodeURIComponent(url.pathname)}`);
	return { me: locals.user };
};
