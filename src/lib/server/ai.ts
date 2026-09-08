/**
 * Provider-agnostic AI layer.
 *
 * One env var picks the provider; nothing else in the app imports a vendor
 * package. Swapping Anthropic → OpenAI → a local Ollama box is a config change,
 * not a code change.
 *
 *   AI_PROVIDER=anthropic|openai|ollama   (default: anthropic)
 *   AI_MODEL=<model id>                   (per-provider default below)
 *   ANTHROPIC_API_KEY / OPENAI_API_KEY    (ollama needs none)
 *
 * Adapter factories take the model positionally — verified against the shipped
 * type definitions, which differ from some published examples.
 */
import { env } from '$env/dynamic/private';
import { anthropicText } from '@tanstack/ai-anthropic';
import { openaiText } from '@tanstack/ai-openai';
import { ollamaText } from '@tanstack/ai-ollama';
import { getSettings } from './settings';

export type Provider = 'anthropic' | 'openai' | 'ollama';

const DEFAULT_MODEL: Record<Provider, string> = {
	anthropic: 'claude-sonnet-5',
	openai: 'gpt-4o',
	ollama: 'llama3'
};

export const provider = (): Provider => {
	const p = env.AI_PROVIDER;
	return p === 'openai' || p === 'ollama' ? p : 'anthropic';
};

/** Ollama runs locally with no key, so "configured" differs per provider. */
export function isAiConfigured(): boolean {
	const p = provider();
	if (p === 'ollama') return true;
	if (p === 'openai') return !!env.OPENAI_API_KEY;
	return !!env.ANTHROPIC_API_KEY;
}

export function textAdapter() {
	const model = env.AI_MODEL || DEFAULT_MODEL[provider()];
	switch (provider()) {
		case 'openai':
			return openaiText(model as Parameters<typeof openaiText>[0]);
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
