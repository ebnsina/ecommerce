import { sql } from 'drizzle-orm';
import { db } from './db';
import { rateLimits } from './db/schema';

export type Limit = { ok: true; remaining: number } | { ok: false; retryAfter: number };

/**
 * Fixed-window counter. One upsert per call — no read-then-write race.
 * ponytail: fixed window, not sliding; a burst can straddle two windows.
 * Swap for a token bucket only if that turns out to matter.
 */
export async function consume(key: string, max: number, windowSeconds: number): Promise<Limit> {
	const now = new Date();
	const [row] = await db
		.insert(rateLimits)
		.values({ key, count: 1, resetAt: new Date(now.getTime() + windowSeconds * 1000) })
		.onConflictDoUpdate({
			target: rateLimits.key,
			set: {
				// window expired -> restart at 1, otherwise increment
				count: sql`case when ${rateLimits.resetAt} < now() then 1 else ${rateLimits.count} + 1 end`,
				resetAt: sql`case when ${rateLimits.resetAt} < now()
					then now() + (${windowSeconds} * interval '1 second') else ${rateLimits.resetAt} end`
			}
		})
		.returning();

	if (row.count > max)
		return {
			ok: false,
			retryAfter: Math.max(1, Math.ceil((row.resetAt.getTime() - Date.now()) / 1000))
		};
	return { ok: true, remaining: max - row.count };
}

/** Clears a counter after a success, so one good login resets the streak. */
export async function reset(key: string) {
	await db.delete(rateLimits).where(sql`${rateLimits.key} = ${key}`);
}
