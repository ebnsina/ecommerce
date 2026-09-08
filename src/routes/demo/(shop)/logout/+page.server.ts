import { redirect } from '@sveltejs/kit';
import { SHOP } from '$lib/paths';
import { destroySession, clearSessionCookie, readSessionCookie } from '$lib/server/auth';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async (event) => {
		const token = readSessionCookie(event);
		if (token) await destroySession(token);
		clearSessionCookie(event);
		redirect(303, SHOP);
	}
};
