/**
 * Streaming chat endpoint. Staff-only for now: it powers the inbox reply
 * assistant, so it must never be reachable by shoppers — an open LLM endpoint
 * on a storefront is somebody else's free API key.
 */
import { json, error } from '@sveltejs/kit';
import { chat, toServerSentEventsResponse } from '@tanstack/ai';
import { textAdapter, isAiConfigured, systemPrompt, provider } from '$lib/server/ai';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (locals.user?.kind !== 'admin') error(403, 'Staff only');

	if (!isAiConfigured())
		return json(
			{ error: `AI is not configured. Set the API key for AI_PROVIDER=${provider()}.` },
			{ status: 503 }
		);

	const body = await request.json().catch(() => null);
	const messages = Array.isArray(body?.messages) ? body.messages : null;
	if (!messages?.length) return json({ error: 'No messages supplied.' }, { status: 400 });

	try {
		const stream = chat({
			adapter: textAdapter(),
			messages: [{ role: 'system', content: await systemPrompt() }, ...messages]
		});
		return toServerSentEventsResponse(stream);
	} catch (e) {
		return json({ error: (e as Error).message }, { status: 502 });
	}
};
