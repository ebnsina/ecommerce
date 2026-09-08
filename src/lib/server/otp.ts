/** One-time codes for phone login. Codes are hashed; only the phone sees the digits. */
import { randomInt, createHash, timingSafeEqual } from 'node:crypto';
import { and, desc, eq, gt } from 'drizzle-orm';
import { db } from './db';
import { otpCodes } from './db/schema';
import { consume } from './ratelimit';
import { sendSms } from './sms';
import { getSettings } from './settings';

const hash = (code: string) => createHash('sha256').update(code).digest('hex');

export async function requestOtp(
	phone: string,
	ip: string
): Promise<{ ok: true } | { ok: false; error: string }> {
	const { auth } = await getSettings();

	// Two limits: this number, and this network. Both matter.
	const perPhone = await consume(`otp:send:${phone}`, 3, 15 * 60);
	if (!perPhone.ok)
		return {
			ok: false,
			error: `Too many codes requested. Try again in ${Math.ceil(perPhone.retryAfter / 60)} minutes.`
		};
	const perIp = await consume(`otp:ip:${ip}`, 15, 60 * 60);
	if (!perIp.ok) return { ok: false, error: 'Too many attempts from this network. Try later.' };

	const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
	await db.insert(otpCodes).values({
		phone,
		codeHash: hash(code),
		expiresAt: new Date(Date.now() + auth.otpTtlMinutes * 60_000)
	});

	await sendSms(
		phone,
		`${code} is your verification code. It expires in ${auth.otpTtlMinutes} minutes.`
	);
	return { ok: true };
}

export async function verifyOtp(
	phone: string,
	code: string
): Promise<{ ok: true } | { ok: false; error: string }> {
	const { auth } = await getSettings();

	const [row] = await db
		.select()
		.from(otpCodes)
		.where(and(eq(otpCodes.phone, phone), gt(otpCodes.expiresAt, new Date())))
		.orderBy(desc(otpCodes.createdAt))
		.limit(1);

	if (!row) return { ok: false, error: 'That code has expired. Request a new one.' };
	if (row.attempts >= auth.maxAttempts)
		return { ok: false, error: 'Too many wrong codes. Request a new one.' };

	const given = Buffer.from(hash(code));
	const expected = Buffer.from(row.codeHash);
	const match = given.length === expected.length && timingSafeEqual(given, expected);

	if (!match) {
		await db
			.update(otpCodes)
			.set({ attempts: row.attempts + 1 })
			.where(eq(otpCodes.id, row.id));
		return { ok: false, error: 'That code is not right.' };
	}

	// Burn every outstanding code for this number, not just the one used.
	await db.delete(otpCodes).where(eq(otpCodes.phone, phone));
	return { ok: true };
}
