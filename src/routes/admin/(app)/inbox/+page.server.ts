import { and, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { conversations, messages } from '$lib/server/db/schema';
import { channelStatus } from '$lib/server/channels';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const status = url.searchParams.get('status') ?? 'open';
	const channel = url.searchParams.get('channel') ?? '';
	const q = url.searchParams.get('q')?.trim() ?? '';

	const where = and(
		status === 'all' ? undefined : eq(conversations.status, status as 'open'),
		channel ? eq(conversations.channel, channel as 'site') : undefined,
		q ? or(ilike(conversations.name, `%${q}%`), ilike(conversations.phone, `%${q}%`)) : undefined
	);

	const [threads, counts] = await Promise.all([
		db
			.select({
				id: conversations.id,
				channel: conversations.channel,
				name: conversations.name,
				phone: conversations.phone,
				status: conversations.status,
				unread: conversations.unread,
				lastMessageAt: conversations.lastMessageAt,
				// The preview line is the newest message, whoever sent it.
				preview: sql<string>`coalesce((
					select m.body from messages m
					where m.conversation_id = conversations.id
					order by m.created_at desc limit 1
				), '')`
			})
			.from(conversations)
			.where(where)
			.orderBy(desc(conversations.lastMessageAt))
			.limit(100),

		db
			.select({ status: conversations.status, n: sql<number>`count(*)::int` })
			.from(conversations)
			.groupBy(conversations.status)
	]);

	return {
		threads,
		channels: channelStatus(),
		counts: Object.fromEntries(counts.map((c) => [c.status, c.n])) as Record<string, number>,
		filters: { status, channel, q }
	};
};
