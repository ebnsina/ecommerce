/**
 * Channel adapters. Every platform implements the same two-method contract, so
 * the inbox never learns which service a thread came from beyond a badge — the
 * same shape as the storage drivers.
 *
 * A platform without credentials reports `configured: false` and is shown as
 * "not connected" rather than failing at send time.
 */
import { env } from '$env/dynamic/private';
import { sendSms } from '../sms';

export type ChannelKey = 'site' | 'messenger' | 'instagram' | 'whatsapp' | 'telegram' | 'sms';

export type OutboundTarget = {
	/** Platform thread id: page-scoped sender id, chat id, or phone number. */
	externalId: string | null;
	phone: string | null;
};

export type ChannelAdapter = {
	key: ChannelKey;
	label: string;
	/** Credentials present. Never throws — the inbox renders this. */
	configured: () => boolean;
	/** Delivers a reply. Returns the platform's message id when it gives one. */
	send: (to: OutboundTarget, text: string) => Promise<{ externalId?: string }>;
};

const notConfigured = (label: string) => {
	throw new Error(`${label} is not connected. Add its credentials in the environment.`);
};

/** The store's own chat widget: nothing to call, the customer polls the thread. */
const site: ChannelAdapter = {
	key: 'site',
	label: 'Website chat',
	configured: () => true,
	send: async () => ({})
};

const sms: ChannelAdapter = {
	key: 'sms',
	label: 'SMS',
	configured: () => true, // logs to the console until a gateway is set
	send: async (to, text) => {
		if (!to.phone) throw new Error('That thread has no phone number.');
		await sendSms(to.phone, text);
		return {};
	}
};

const telegram: ChannelAdapter = {
	key: 'telegram',
	label: 'Telegram',
	configured: () => !!env.TELEGRAM_BOT_TOKEN,
	send: async (to, text) => {
		if (!telegram.configured()) notConfigured('Telegram');
		if (!to.externalId) throw new Error('That thread has no Telegram chat id.');

		const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ chat_id: to.externalId, text })
		});
		const data = await res.json().catch(() => ({}));
		if (!res.ok || data?.ok === false)
			throw new Error(data?.description ?? `Telegram refused the message (${res.status}).`);
		return { externalId: String(data?.result?.message_id ?? '') };
	}
};

const whatsapp: ChannelAdapter = {
	key: 'whatsapp',
	label: 'WhatsApp',
	configured: () => !!(env.WHATSAPP_TOKEN && env.WHATSAPP_PHONE_ID),
	send: async (to, text) => {
		if (!whatsapp.configured()) notConfigured('WhatsApp');
		const target = to.externalId ?? (to.phone ? `88${to.phone.replace(/^0/, '')}` : null);
		if (!target) throw new Error('That thread has no WhatsApp number.');

		const res = await fetch(`https://graph.facebook.com/v21.0/${env.WHATSAPP_PHONE_ID}/messages`, {
			method: 'POST',
			headers: {
				authorization: `Bearer ${env.WHATSAPP_TOKEN}`,
				'content-type': 'application/json'
			},
			body: JSON.stringify({
				messaging_product: 'whatsapp',
				to: target,
				type: 'text',
				text: { body: text }
			})
		});
		const data = await res.json().catch(() => ({}));
		// Outside the 24-hour service window WhatsApp only accepts templates —
		// surface that plainly rather than as a raw Graph error code.
		if (!res.ok)
			throw new Error(
				data?.error?.message ??
					`WhatsApp refused the message (${res.status}). Outside the 24-hour window only approved templates can be sent.`
			);
		return { externalId: data?.messages?.[0]?.id };
	}
};

/** Messenger and Instagram DM share one Meta app and one Send API. */
function metaMessenger(key: 'messenger' | 'instagram', label: string): ChannelAdapter {
	return {
		key,
		label,
		configured: () => !!env.META_PAGE_TOKEN,
		send: async (to, text) => {
			if (!env.META_PAGE_TOKEN) notConfigured(label);
			if (!to.externalId) throw new Error(`That thread has no ${label} recipient id.`);

			const res = await fetch(
				`https://graph.facebook.com/v21.0/me/messages?access_token=${env.META_PAGE_TOKEN}`,
				{
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify({
						recipient: { id: to.externalId },
						messaging_type: 'RESPONSE',
						message: { text }
					})
				}
			);
			const data = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(data?.error?.message ?? `${label} refused the message.`);
			return { externalId: data?.message_id };
		}
	};
}

export const adapters: Record<ChannelKey, ChannelAdapter> = {
	site,
	sms,
	telegram,
	whatsapp,
	messenger: metaMessenger('messenger', 'Messenger'),
	instagram: metaMessenger('instagram', 'Instagram')
};

export const channelStatus = () =>
	Object.values(adapters).map((a) => ({
		key: a.key,
		label: a.label,
		configured: a.configured()
	}));
