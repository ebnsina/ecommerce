/**
 * Sessions. No auth library — a session table is ~60 lines (hashing lives in ./password).
 *
 * One session table serves admins and customers; exactly one id is set.
 * The cookie holds the raw token, the DB holds only its sha256 — a DB leak
 * cannot be replayed as a login.
 */
import { randomBytes, createHash } from 'node:crypto';
import { eq, lt, and } from 'drizzle-orm';
import type { RequestEvent } from '@sveltejs/kit';
import { db } from './db';
import { sessions, adminUsers, customers } from './db/schema';

export { hashPassword, verifyPassword } from './password';

const SESSION_COOKIE = 'session';
const SESSION_DAYS = 30;
const RENEW_AFTER_DAYS = 15;

/* ── sessions ────────────────────────────────────────────────────────── */

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

export async function createSession(who: {
	adminUserId?: string;
	customerId?: string;
}): Promise<{ token: string; expiresAt: Date }> {
	const token = randomBytes(24).toString('base64url');
	const expiresAt = new Date(Date.now() + SESSION_DAYS * 864e5);
	await db.insert(sessions).values({
		id: hashToken(token),
		adminUserId: who.adminUserId ?? null,
		customerId: who.customerId ?? null,
		expiresAt
	});
	return { token, expiresAt };
}

export type SessionUser =
	| { kind: 'admin'; id: string; name: string; email: string; role: 'owner' | 'manager' | 'staff' }
	| { kind: 'customer'; id: string; phone: string; name: string | null };

/** Returns the user behind a token, sliding the expiry when it is half spent. */
export async function validateSession(token: string): Promise<SessionUser | null> {
	const sid = hashToken(token);
	const [row] = await db.select().from(sessions).where(eq(sessions.id, sid)).limit(1);
	if (!row) return null;

	if (row.expiresAt.getTime() < Date.now()) {
		await db.delete(sessions).where(eq(sessions.id, sid));
		return null;
	}

	if (row.expiresAt.getTime() - Date.now() < RENEW_AFTER_DAYS * 864e5) {
		await db
			.update(sessions)
			.set({ expiresAt: new Date(Date.now() + SESSION_DAYS * 864e5) })
			.where(eq(sessions.id, sid));
	}

	if (row.adminUserId) {
		const [u] = await db
			.select()
			.from(adminUsers)
			.where(and(eq(adminUsers.id, row.adminUserId), eq(adminUsers.active, true)))
			.limit(1);
		return u ? { kind: 'admin', id: u.id, name: u.name, email: u.email, role: u.role } : null;
	}
	if (row.customerId) {
		const [c] = await db.select().from(customers).where(eq(customers.id, row.customerId)).limit(1);
		return c ? { kind: 'customer', id: c.id, phone: c.phone, name: c.name } : null;
	}
	return null;
}

export async function destroySession(token: string) {
	await db.delete(sessions).where(eq(sessions.id, hashToken(token)));
}

/** Housekeeping — call from the cron route. */
export async function purgeExpiredSessions() {
	await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
}

/* ── cookies ─────────────────────────────────────────────────────────── */

export function setSessionCookie(event: RequestEvent, token: string, expiresAt: Date) {
	event.cookies.set(SESSION_COOKIE, token, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: !import.meta.env.DEV,
		expires: expiresAt
	});
}

export function clearSessionCookie(event: RequestEvent) {
	event.cookies.delete(SESSION_COOKIE, { path: '/' });
}

export const readSessionCookie = (event: RequestEvent) => event.cookies.get(SESSION_COOKIE);
