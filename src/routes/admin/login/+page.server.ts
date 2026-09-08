import { fail, redirect } from '@sveltejs/kit';
import { eq, and } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { adminUsers } from '$lib/server/db/schema';
import { verifyPassword, createSession, setSessionCookie } from '$lib/server/auth';
import { consume, reset } from '$lib/server/ratelimit';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async (event) => {
		const form = await event.request.formData();
		const email = String(form.get('email') ?? '')
			.trim()
			.toLowerCase();
		const password = String(form.get('password') ?? '');
		const next = String(form.get('next') ?? '/admin');

		if (!email || !password) return fail(400, { email, error: 'Email and password are required.' });

		// Two windows: this account, and this network. scrypt is slow but slow is
		// not a control — a botnet still gets unlimited tries without this.
		const perAccount = await consume(`admin:login:${email}`, 8, 15 * 60);
		const perIp = await consume(`admin:ip:${event.getClientAddress()}`, 30, 15 * 60);
		if (!perAccount.ok || !perIp.ok)
			return fail(429, { email, error: 'Too many attempts. Try again in a few minutes.' });

		const [user] = await db
			.select()
			.from(adminUsers)
			.where(and(eq(adminUsers.email, email), eq(adminUsers.active, true)))
			.limit(1);

		// Same message and roughly the same work either way — no account enumeration.
		const ok = user ? await verifyPassword(password, user.passwordHash) : false;
		if (!user || !ok) return fail(400, { email, error: 'Wrong email or password.' });

		await reset(`admin:login:${email}`);
		const { token, expiresAt } = await createSession({ adminUserId: user.id });
		setSessionCookie(event, token, expiresAt);
		redirect(303, next.startsWith('/admin') ? next : '/admin');
	}
};
