/**
 * Answering a customer without a person in the loop.
 *
 * This is the one place in the shop where a mistake is public and immediate,
 * so it is deliberately timid. Three gates stand between a message arriving
 * and a reply going out:
 *
 *   1. The owner has switched it on, for that channel.
 *   2. The model classified the question into a small allowlist of things the
 *      shop's own settings can answer — a delivery charge, an opening hour.
 *      Anything about a specific order, a price, a refund or a complaint is
 *      never answered automatically, however sure the model claims to be.
 *   3. The model's own confidence clears the threshold the owner set.
 *
 * Anything that fails a gate leaves the thread untouched for a person, which
 * is the same outcome as having no assistant at all.
 */
import { and, count, eq } from 'drizzle-orm';
import { env } from '$env/dynamic/private';
import { db } from './db';
import { conversations, messages } from './db/schema';
import { getSettings } from './settings';
import { generateJson, isAiConfigured } from './ai';
import { adapters, type ChannelKey } from './channels';

/**
 * What the assistant is allowed to answer on its own. Every one of these is
 * answerable from the shop's settings alone — no order lookup, no stock, no
 * promise about a specific parcel.
 */
export const SAFE_INTENTS = [
	'delivery_charge',
	'delivery_time',
	'payment_methods',
	'cash_on_delivery',
	'return_policy',
	'opening_hours',
	'greeting'
] as const;

export type SafeIntent = (typeof SAFE_INTENTS)[number];

export type Classification = {
	intent: SafeIntent | 'other';
	confidence: number;
	reply: string;
};

/** A hard off switch that does not depend on anyone remembering a setting. */
export const autoReplyDisabled = () => env.AI_AUTO_REPLY === 'off';

const prompt = (facts: string) => `You triage customer messages for a Bangladeshi online shop.

Facts you may use:
${facts}

Classify the customer's message into exactly one intent:
${SAFE_INTENTS.join(', ')}, or "other".

Use "other" — always — when the message is about a specific order, a specific
product's price or stock, a complaint, a refund, a cancellation, or anything
the facts above do not answer. "other" is the safe answer and choosing it is
never wrong.

Then write the reply you would send, in whichever language the customer used
(Bangla, English or romanised Bangla). Two or three sentences. Never invent a
price, a date, a stock level or a discount.

Answer as JSON only:
{"intent": "...", "confidence": 0-100, "reply": "..."}

confidence is how certain you are of the intent AND that the facts above fully
answer it. If you are guessing, say so with a low number.`;

/**
 * Decides whether to answer, and with what. Returns why it declined so the
 * inbox can show staff what the assistant thought rather than staying silent.
 */
export async function considerAutoReply(conversationId: string, body: string) {
	if (autoReplyDisabled())
		return { sent: false, reason: 'Auto-reply is switched off in the environment.' };
	if (!isAiConfigured()) return { sent: false, reason: 'No AI provider is configured.' };

	const settings = await getSettings();
	const rules = settings.autoReply;
	if (!rules?.enabled) return { sent: false, reason: 'Auto-reply is off.' };

	const [conversation] = await db
		.select()
		.from(conversations)
		.where(eq(conversations.id, conversationId))
		.limit(1);
	if (!conversation) return { sent: false, reason: 'No such conversation.' };

	if (!rules.channels.includes(conversation.channel))
		return { sent: false, reason: `Auto-reply is off for ${conversation.channel}.` };

	// A thread a person has picked up belongs to that person.
	if (conversation.assignedTo)
		return { sent: false, reason: 'A colleague is already handling this thread.' };

	// One automatic answer per thread. If it did not settle the question, a
	// second guess will not either — and two robot replies in a row is how a
	// customer decides nobody is listening.
	const [{ n: already }] = await db
		.select({ n: count() })
		.from(messages)
		.where(and(eq(messages.conversationId, conversationId), eq(messages.author, 'ai')));
	if (already > 0) return { sent: false, reason: 'This thread already had an automatic reply.' };

	const facts = await import('./ai').then((m) => m.storeContext());
	const verdict = await generateJson<Classification>(prompt(facts), body);
	if (!verdict) return { sent: false, reason: 'The assistant did not answer.' };

	const intent = verdict.intent;
	const confidence = Number(verdict.confidence ?? 0);

	if (!SAFE_INTENTS.includes(intent as SafeIntent))
		return {
			sent: false,
			reason: 'Needs a person: outside what the shop settings can answer.',
			verdict
		};

	if (confidence < rules.confidence)
		return {
			sent: false,
			reason: `Not confident enough (${confidence}%, needs ${rules.confidence}%).`,
			verdict
		};

	const reply = String(verdict.reply ?? '').trim();
	if (!reply) return { sent: false, reason: 'The assistant produced no reply.', verdict };

	const adapter = adapters[conversation.channel as ChannelKey];
	if (!adapter?.configured())
		return { sent: false, reason: `${conversation.channel} is not connected.`, verdict };

	// Recorded before sending: a message the customer received but that is not
	// in the thread is worse than one recorded twice.
	await db.insert(messages).values({
		conversationId,
		inbound: false,
		author: 'ai',
		authorName: 'Assistant',
		body: reply
	});

	try {
		await adapter.send({ externalId: conversation.externalId, phone: conversation.phone }, reply);
	} catch (e) {
		return { sent: false, reason: `Could not send: ${(e as Error).message}`, verdict };
	}

	// The thread stays open and unread. An automatic answer is not a resolution,
	// and somebody should still look at it.
	await db
		.update(conversations)
		.set({ lastMessageAt: new Date() })
		.where(eq(conversations.id, conversationId));

	return { sent: true, reason: `Answered ${intent} at ${confidence}%.`, verdict };
}
