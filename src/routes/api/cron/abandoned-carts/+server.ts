/**
 * Sends one reminder per abandoned cart. Point a scheduler at it hourly; the
 * delay in Settings, not the schedule, decides how long a cart waits.
 */
import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { getSettings } from '$lib/server/settings';
import { abandonedCarts, sendReminder } from '$lib/server/recovery';
import type { RequestHandler } from './$types';

const run: RequestHandler = async ({ request, url }) => {
	const secret = env.CRON_SECRET;
	if (!secret) error(503, 'CRON_SECRET is not set');
	if (request.headers.get('authorization') !== `Bearer ${secret}`) error(403, 'Bad secret');

	const { recovery } = await getSettings();
	if (!recovery.enabled) return json({ enabled: false, sent: 0 });

	const before = new Date(Date.now() - recovery.delayHours * 3600_000);
	const carts = await abandonedCarts(before, true);

	let sent = 0;
	for (const cart of carts) if (await sendReminder(cart, url.origin)) sent++;

	return json({ enabled: true, found: carts.length, sent });
};

/* Either verb: most schedulers issue a GET, and POST is there for triggering
   a run by hand. The secret goes in an Authorization: Bearer header. */
export const GET = run;
export const POST = run;
