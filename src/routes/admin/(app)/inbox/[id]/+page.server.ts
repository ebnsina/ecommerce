import { error, fail } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { conversations } from '$lib/server/db/schema';
import { getThread, replyToConversation } from '$lib/server/inbox';
import { adapters, type ChannelKey } from '$lib/server/channels';
import { isAiConfigured, provider } from '$lib/server/ai';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const thread = await getThread(params.id);
	if (!thread) error(404, 'Conversation not found');

	// Opening a thread marks it read — that is what opening it means.
	if (thread.conversation.unread)
		await db.update(conversations).set({ unread: false }).where(eq(conversations.id, params.id));

	const adapter = adapters[thread.conversation.channel as ChannelKey];

	return {
		...thread,
		channelLabel: adapter.label,
		channelReady: adapter.configured(),
		aiReady: isAiConfigured(),
		aiProvider: provider()
	};
};

export const actions: Actions = {
	reply: async ({ request, params, locals }) => {
		const form = await request.formData();
		const body = String(form.get('body') ?? '').trim();
		if (!body) return fail(400, { error: 'Write something first.' });

		const staffName = locals.user?.kind === 'admin' ? locals.user.name : 'Staff';
		try {
			await replyToConversation(params.id, body, staffName, form.get('fromSuggestion') === 'on');
		} catch (e) {
			// Delivery failures are the interesting ones — surface the platform's words.
			return fail(502, { error: (e as Error).message });
		}
		return { sent: true };
	},

	setStatus: async ({ request, params }) => {
		const status = String((await request.formData()).get('status') ?? 'open');
		if (!['open', 'snoozed', 'closed'].includes(status))
			return fail(400, { error: 'Unknown status.' });
		await db
			.update(conversations)
			.set({ status: status as 'open' })
			.where(eq(conversations.id, params.id));
		return { ok: true };
	}
};
