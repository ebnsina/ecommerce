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
	const sent = Array.isArray(body?.messages) ? body.messages : null;
	if (!sent?.length) return json({ error: 'No messages supplied.' }, { status: 400 });

	/* Callers send the plain {role, content} that every chat API takes; a
	   UIMessage carries an id and `parts`. Converted here so the inbox does not
	   have to know the difference. */
	const messages = sent.map((m: { role?: string; content?: string }, i: number) => ({
		id: `m${i}`,
		role: m.role === 'assistant' ? ('assistant' as const) : ('user' as const),
		parts: [{ type: 'text' as const, content: String(m.content ?? '') }]
	}));

	try {
		const stream = chat({
			adapter: textAdapter(),
			/* Its own option, not a message. Passed as a message with role
			   'system' it is dropped, and the assistant answers with no idea
			   which shop it works for. */
			systemPrompts: [await systemPrompt()],
			messages
		});
		return toServerSentEventsResponse(stream);
	} catch (e) {
		return json({ error: (e as Error).message }, { status: 502 });
	}
};
