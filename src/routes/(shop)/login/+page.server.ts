import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { customers } from '$lib/server/db/schema';
import { normalizePhone } from '$lib/phone';
import { requestOtp, verifyOtp } from '$lib/server/otp';
import { hashPassword, verifyPassword, createSession, setSessionCookie } from '$lib/server/auth';
import { consume, reset } from '$lib/server/ratelimit';
import { mergeGuestCart } from '$lib/server/cart';
import { getSettings } from '$lib/server/settings';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (locals.user?.kind === 'customer') redirect(303, url.searchParams.get('next') ?? '/account');
	const { auth } = await getSettings();
	return { otpEnabled: auth.otpEnabled, next: url.searchParams.get('next') ?? '/account' };
};

/** Signs the customer in, folding their guest cart into the account. */
async function signIn(event: Parameters<Actions[string]>[0], customerId: string, next: string) {
	await mergeGuestCart(event, customerId);
	const { token, expiresAt } = await createSession({ customerId });
	setSessionCookie(event, token, expiresAt);
	redirect(303, next.startsWith('/') ? next : '/account');
}

export const actions: Actions = {
	/** Step 1 with OTP on: send the code. */
	sendCode: async (event) => {
		const form = await event.request.formData();
		const phone = normalizePhone(String(form.get('phone') ?? ''));
		if (!phone) return fail(400, { error: 'Enter a valid Bangladeshi mobile number.' });

		const result = await requestOtp(phone, event.getClientAddress());
		if (!result.ok) return fail(429, { phone, error: result.error });

		return { step: 'code' as const, phone };
	},

	/** Step 2 with OTP on: check the code, creating the account on first sign-in. */
	verify: async (event) => {
		const form = await event.request.formData();
		const phone = normalizePhone(String(form.get('phone') ?? ''));
		const code = String(form.get('code') ?? '').trim();
		const next = String(form.get('next') ?? '/account');
		if (!phone) return fail(400, { error: 'Start again with your mobile number.' });

		const result = await verifyOtp(phone, code);
		if (!result.ok) return fail(400, { step: 'code' as const, phone, error: result.error });

		const [existing] = await db.select().from(customers).where(eq(customers.phone, phone)).limit(1);
		const id =
			existing?.id ??
			(
				await db
					.insert(customers)
					.values({ phone, phoneVerified: true })
					.returning({ id: customers.id })
			)[0].id;

		if (existing && !existing.phoneVerified)
			await db.update(customers).set({ phoneVerified: true }).where(eq(customers.id, id));

		return signIn(event, id, next);
	},

	/** OTP off: phone + password. First sign-in sets the password. */
	password: async (event) => {
		const form = await event.request.formData();
		const phone = normalizePhone(String(form.get('phone') ?? ''));
		const password = String(form.get('password') ?? '');
		const next = String(form.get('next') ?? '/account');

		if (!phone) return fail(400, { error: 'Enter a valid Bangladeshi mobile number.' });
		if (password.length < 6)
			return fail(400, { phone, error: 'Password must be at least 6 characters.' });

		const limit = await consume(`login:${phone}`, 8, 15 * 60);
		if (!limit.ok)
			return fail(429, { phone, error: 'Too many attempts. Try again in a few minutes.' });

		const [existing] = await db.select().from(customers).where(eq(customers.phone, phone)).limit(1);

		if (!existing) {
			const [created] = await db
				.insert(customers)
				.values({ phone, passwordHash: await hashPassword(password) })
				.returning({ id: customers.id });
			await reset(`login:${phone}`);
			return signIn(event, created.id, next);
		}

		if (!existing.passwordHash) {
			// Account was created by OTP before the toggle flipped — set it now.
			await db
				.update(customers)
				.set({ passwordHash: await hashPassword(password) })
				.where(eq(customers.id, existing.id));
			await reset(`login:${phone}`);
			return signIn(event, existing.id, next);
		}

		if (!(await verifyPassword(password, existing.passwordHash)))
			return fail(400, { phone, error: 'Wrong number or password.' });

		await reset(`login:${phone}`);
		return signIn(event, existing.id, next);
	}
};
