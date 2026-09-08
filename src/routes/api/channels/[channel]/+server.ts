/**
 * Inbound webhooks. One route, one normaliser per platform — every payload
 * becomes the same `receiveMessage()` call, so the inbox has no per-channel code.
 *
 * Endpoints (set these as the callback URL on each platform):
 *   /api/channels/telegram
 *   /api/channels/whatsapp
 *   /api/channels/messenger
 *   /api/channels/instagram
 *
 * Verification differs by platform and is not optional: an unverified webhook is
 * a public endpoint that writes to your inbox.
 *   Telegram — secret token echoed in X-Telegram-Bot-Api-Secret-Token
 *   Meta     — GET hub.challenge handshake, then HMAC-SHA256 body signature
 */
import { error, json, text } from '@sveltejs/kit';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from '$env/dynamic/private';
import { receiveMessage } from '$lib/server/inbox';
import type { ChannelKey } from '$lib/server/channels';
import type { RequestHandler } from './$types';

const META_CHANNELS = new Set(['whatsapp', 'messenger', 'instagram']);
const SUPPORTED = new Set(['telegram', 'whatsapp', 'messenger', 'instagram']);

/** Meta's subscription handshake: echo hub.challenge when the token matches. */
export const GET: RequestHandler = async ({ params, url }) => {
	if (!META_CHANNELS.has(params.channel)) error(404, 'No such webhook');

	const expected = env.META_VERIFY_TOKEN;
	if (!expected) error(503, 'META_VERIFY_TOKEN is not set');

	if (
		url.searchParams.get('hub.mode') === 'subscribe' &&
		url.searchParams.get('hub.verify_token') === expected
	)
		return text(url.searchParams.get('hub.challenge') ?? '');

	error(403, 'Verification failed');
};

const safeEqual = (a: string, b: string) => {
	const x = Buffer.from(a);
	const y = Buffer.from(b);
	return x.length === y.length && timingSafeEqual(x, y);
};

/** Meta signs the raw body; compare against the untouched bytes, not a re-encode. */
function verifyMetaSignature(raw: string, header: string | null): boolean {
	const secret = env.META_APP_SECRET;
	if (!secret) return false;
	if (!header?.startsWith('sha256=')) return false;
	const digest = createHmac('sha256', secret).update(raw).digest('hex');
	return safeEqual(header.slice(7), digest);
}

type Normalised = {
	externalId: string;
	name: string;
	phone?: string | null;
	body: string;
	messageId?: string | null;
};

function fromTelegram(payload: any): Normalised[] {
	const msg = payload?.message ?? payload?.edited_message;
	if (!msg?.chat?.id || !msg?.text) return [];
	const from = msg.from ?? {};
	return [
		{
			externalId: String(msg.chat.id),
			name:
				[from.first_name, from.last_name].filter(Boolean).join(' ') ||
				from.username ||
				'Telegram user',
			body: String(msg.text),
			messageId: msg.message_id ? String(msg.message_id) : null
		}
	];
}

function fromWhatsApp(payload: any): Normalised[] {
	const out: Normalised[] = [];
	for (const entry of payload?.entry ?? []) {
		for (const change of entry?.changes ?? []) {
			const value = change?.value ?? {};
			const contacts: any[] = value.contacts ?? [];
			for (const m of value.messages ?? []) {
				if (m.type !== 'text' || !m.text?.body) continue;
				const contact = contacts.find((c) => c.wa_id === m.from);
				out.push({
					externalId: String(m.from),
					name: contact?.profile?.name || 'WhatsApp user',
					// wa_id is an international number; store the local form.
					phone: String(m.from).replace(/^880?/, '0'),
					body: String(m.text.body),
					messageId: m.id ?? null
				});
			}
		}
	}
	return out;
}

/** Messenger and Instagram share the Graph messaging envelope. */
function fromMeta(payload: any): Normalised[] {
	const out: Normalised[] = [];
	for (const entry of payload?.entry ?? []) {
		for (const evt of entry?.messaging ?? []) {
			// `is_echo` is our own outbound message coming back — ignore it or the
			// thread fills with duplicates of what staff just sent.
			if (!evt?.message?.text || evt.message.is_echo) continue;
			out.push({
				externalId: String(evt.sender?.id ?? ''),
				name: 'Customer',
				body: String(evt.message.text),
				messageId: evt.message.mid ?? null
			});
		}
	}
	return out.filter((m) => m.externalId);
}

export const POST: RequestHandler = async ({ params, request }) => {
	const channel = params.channel as ChannelKey;
	if (!SUPPORTED.has(channel)) error(404, 'No such webhook');

	const raw = await request.text();

	if (channel === 'telegram') {
		const secret = env.TELEGRAM_WEBHOOK_SECRET;
		if (!secret) error(503, 'TELEGRAM_WEBHOOK_SECRET is not set');
		const given = request.headers.get('x-telegram-bot-api-secret-token') ?? '';
		if (!safeEqual(given, secret)) error(403, 'Bad secret token');
	} else if (!verifyMetaSignature(raw, request.headers.get('x-hub-signature-256'))) {
		error(403, 'Bad signature');
	}

	let payload: any;
	try {
		payload = JSON.parse(raw);
	} catch {
		error(400, 'Malformed payload');
	}

	const incoming =
		channel === 'telegram'
			? fromTelegram(payload)
			: channel === 'whatsapp'
				? fromWhatsApp(payload)
				: fromMeta(payload);

	for (const m of incoming) await receiveMessage({ channel, ...m });

	// Platforms retry anything that is not a fast 200, so acknowledge and move on.
	return json({ received: incoming.length });
};
