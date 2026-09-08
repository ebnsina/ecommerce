/**
 * Provider-agnostic AI layer.
 *
 * One env var picks the provider; nothing else in the app imports a vendor
 * package. Swapping Anthropic → OpenAI → a local Ollama box is a config change,
 * not a code change.
 *
 *   AI_PROVIDER=anthropic|openai|groq|ollama  (default: anthropic)
 *   AI_MODEL=<model id>                       (per-provider default below)
 *   ANTHROPIC_API_KEY / OPENAI_API_KEY / GROQ_API_KEY   (ollama needs none)
 *
 * Groq speaks the OpenAI protocol at its own address, so it rides the
 * OpenAI-compatible adapter rather than needing a package of its own.
 *
 * Adapter factories take the model positionally — verified against the shipped
 * type definitions, which differ from some published examples.
 */
import { env } from '$env/dynamic/private';
import { chat } from '@tanstack/ai';
import { anthropicText } from '@tanstack/ai-anthropic';
import { openaiText } from '@tanstack/ai-openai';
import { openaiCompatibleText } from '@tanstack/ai-openai/compatible';
import { ollamaText } from '@tanstack/ai-ollama';
import { getSettings } from './settings';

export type Provider = 'anthropic' | 'openai' | 'groq' | 'ollama';

/** Groq's OpenAI-compatible endpoint. */
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';

const DEFAULT_MODEL: Record<Provider, string> = {
	anthropic: 'claude-sonnet-5',
	openai: 'gpt-4o',
	// Fast and cheap, which is what a reply suggestion wants; set AI_MODEL to
	// openai/gpt-oss-120b or llama-3.3-70b-versatile for better answers.
	groq: 'openai/gpt-oss-20b',
	ollama: 'llama3'
};

export const provider = (): Provider => {
	const p = env.AI_PROVIDER;
	return p === 'openai' || p === 'groq' || p === 'ollama' ? p : 'anthropic';
};

/** Ollama runs locally with no key, so "configured" differs per provider. */
export function isAiConfigured(): boolean {
	const p = provider();
	if (p === 'ollama') return true;
	if (p === 'openai') return !!env.OPENAI_API_KEY;
	if (p === 'groq') return !!env.GROQ_API_KEY;
	return !!env.ANTHROPIC_API_KEY;
}

export function textAdapter() {
	const model = env.AI_MODEL || DEFAULT_MODEL[provider()];
	switch (provider()) {
		case 'openai':
			return openaiText(model as Parameters<typeof openaiText>[0]);
		case 'groq':
			return openaiCompatibleText(model, {
				baseURL: GROQ_BASE_URL,
				apiKey: env.GROQ_API_KEY ?? ''
			});
		case 'ollama':
			return ollamaText(model);
		default:
			return anthropicText(model as Parameters<typeof anthropicText>[0]);
	}
}

/**
 * The store facts the assistant is allowed to state. Everything here comes from
 * the database, so the model never invents a delivery charge or a policy — if a
 * fact is not in this block, the prompt tells it to escalate instead.
 */
export async function storeContext(): Promise<string> {
	const s = await getSettings();
	const zones = Object.values(s.delivery)
		.map(
			(z) =>
				`- ${z.label}: ৳${z.charge / 100}${z.freeAbove > 0 ? `, free over ৳${z.freeAbove / 100}` : ''}`
		)
		.join('\n');

	return [
		`Store: ${s.store.name}`,
		s.store.phone ? `Support phone: ${s.store.phone}` : '',
		`Payment: ${[s.payment.cod && 'cash on delivery', s.payment.sslcommerz && 'online payment'].filter(Boolean).join(', ') || 'none configured'}`,
		s.payment.cod && s.payment.codMaxOrder
			? `Cash on delivery is not available above ৳${s.payment.codMaxOrder / 100}.`
			: '',
		'Delivery charges:',
		zones
	]
		.filter(Boolean)
		.join('\n');
}

export async function systemPrompt(): Promise<string> {
	return `You answer customer messages for a Bangladeshi online shop.

Facts you may rely on:
${await storeContext()}

Rules:
- Answer only from the facts above and from details the customer gives you.
- Never invent a price, a stock level, a delivery date or a discount. If you do
  not know, say a colleague will confirm shortly.
- Never cancel, refund or change an order. Say a colleague will handle it.
- Customers write in Bangla, English, or romanised Bangla ("banglish") — often
  mixed in one message. Reply in whichever the customer used.
- Be brief. Two or three sentences is usually enough.
- Every cash-on-delivery order is confirmed by phone before dispatch; say so if
  someone asks what happens next.`;
}

/**
 * One-shot completion that must come back as JSON.
 *
 * Models wrap JSON in prose and fenced code blocks however firmly they are
 * asked not to, so the first {...} in the response is what gets parsed.
 * Returns null rather than throwing: every caller here has a safe path for
 * "the assistant did not answer".
 */
export async function generateJson<T>(system: string, user: string): Promise<T | null> {
	if (!isAiConfigured()) return null;

	try {
		const stream = chat({
			adapter: textAdapter(),
			// A UIMessage carries `parts`, not a bare `content` string.
			messages: [
				{ id: 'sys', role: 'system' as const, parts: [{ type: 'text' as const, content: system }] },
				{ id: 'usr', role: 'user' as const, parts: [{ type: 'text' as const, content: user }] }
			]
		});

		let text = '';
		for await (const chunk of stream) {
			const c = chunk as { text?: string; delta?: string };
			const part = c.text ?? c.delta ?? '';
			if (typeof part === 'string') text += part;
		}

		const start = text.indexOf('{');
		const end = text.lastIndexOf('}');
		if (start === -1 || end <= start) return null;
		return JSON.parse(text.slice(start, end + 1)) as T;
	} catch (e) {
		console.error('[ai] json completion failed', e);
		return null;
	}
}
