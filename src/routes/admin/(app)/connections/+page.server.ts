import { env } from '$env/dynamic/private';
import { channelStatus } from '$lib/server/channels';
import { courierStatusList } from '$lib/server/couriers';
import { isAiConfigured, provider } from '$lib/server/ai';
import { capiConfigured } from '$lib/server/meta';
import { searchConfigured } from '$lib/server/search';
import { getSettings } from '$lib/server/settings';
import type { PageServerLoad } from './$types';

/**
 * One page that answers "what is not connected, what is it for, and what does
 * my developer need to set". Only variable *names* are listed — never values.
 */
export const load: PageServerLoad = async () => {
	const settings = await getSettings();
	const aiProvider = provider();

	type Item = {
		key: string;
		name: string;
		connected: boolean;
		purpose: string;
		vars: string[];
		webhook: string | null;
	};

	const groups: { title: string; blurb: string; items: Item[] }[] = [
		{
			title: 'Customer messaging',
			blurb: 'Where shoppers reach you. Each connected channel appears in the Inbox.',
			items: channelStatus().map((c) => ({
				key: c.key,
				name: c.label,
				connected: c.configured,
				purpose:
					c.key === 'site'
						? 'Messages sent from your own website. Always available.'
						: c.key === 'sms'
							? 'Order updates and sign-in codes. Falls back to the server log until a gateway is set.'
							: `Replies to customers who message you on ${c.label}.`,
				vars:
					c.key === 'telegram'
						? ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_WEBHOOK_SECRET']
						: c.key === 'whatsapp'
							? ['WHATSAPP_TOKEN', 'WHATSAPP_PHONE_ID', 'META_VERIFY_TOKEN', 'META_APP_SECRET']
							: c.key === 'messenger' || c.key === 'instagram'
								? ['META_PAGE_TOKEN', 'META_VERIFY_TOKEN', 'META_APP_SECRET']
								: c.key === 'sms'
									? ['SMS_API_URL', 'SMS_API_KEY', 'SMS_SENDER_ID']
									: [],
				webhook:
					c.key === 'telegram' ||
					c.key === 'whatsapp' ||
					c.key === 'messenger' ||
					c.key === 'instagram'
						? `/api/channels/${c.key}`
						: null
			}))
		},
		{
			title: 'Reply assistant',
			blurb:
				'Drafts replies in the Inbox for a person to check and send. It never sends on its own.',
			items: [
				{
					key: 'ai',
					name: `AI assistant (${aiProvider})`,
					connected: isAiConfigured(),
					purpose: 'Suggests an answer using your catalogue, delivery charges and order records.',
					vars:
						aiProvider === 'ollama'
							? ['AI_PROVIDER=ollama']
							: aiProvider === 'openai'
								? ['AI_PROVIDER=openai', 'OPENAI_API_KEY']
								: aiProvider === 'groq'
									? ['AI_PROVIDER=groq', 'GROQ_API_KEY', 'AI_MODEL (optional)']
									: ['AI_PROVIDER=anthropic', 'ANTHROPIC_API_KEY'],
					webhook: null
				}
			]
		},
		{
			title: 'Delivery',
			blurb: 'Send parcels without retyping the address, and let statuses update themselves.',
			items: courierStatusList().map((c) => ({
				key: c.key,
				name: c.label,
				connected: c.configured,
				purpose: 'Creates the consignment and keeps the order status in step with the courier.',
				vars: ['STEADFAST_API_KEY', 'STEADFAST_SECRET_KEY', 'CRON_SECRET'],
				webhook: null
			}))
		},
		{
			title: 'Payments',
			blurb: 'Cash on delivery needs nothing. Online payment needs a merchant account.',
			items: [
				{
					key: 'cod',
					name: 'Cash on delivery',
					connected: settings.payment.cod,
					purpose: 'Collect payment at the door. Switch it on under Settings → Payment.',
					vars: [],
					webhook: null
				},
				{
					key: 'sslcommerz',
					name: 'Online payment',
					connected: false,
					purpose:
						'bKash, Nagad, Rocket and cards. Not built yet — cash on delivery covers you for now.',
					vars: [],
					webhook: null
				}
			]
		},
		{
			title: 'Advertising and analytics',
			blurb:
				'Lets each ad platform see which of its ads produced an order, so the money follows what works. Every ID is set under Settings → Ads and analytics.',
			items: [
				{
					key: 'meta-pixel',
					name: 'Meta Pixel',
					connected: !!settings.analytics?.metaPixelId,
					purpose: 'Facebook and Instagram ads: page views, add-to-cart and purchases.',
					vars: [],
					webhook: null
				},
				{
					key: 'meta-capi',
					name: 'Meta Conversions API',
					connected: capiConfigured(settings.analytics?.metaPixelId),
					purpose:
						'Sends the same purchases from the server, so the ones ad blockers hide still get counted. Needs the Meta pixel ID as well.',
					vars: ['META_CAPI_TOKEN', 'META_TEST_EVENT_CODE (while testing)'],
					webhook: null
				},
				{
					key: 'tiktok-pixel',
					name: 'TikTok Pixel',
					connected: !!settings.analytics?.tiktokPixelId,
					purpose: 'TikTok ads: the same events, reported to TikTok Events Manager.',
					vars: [],
					webhook: null
				},
				{
					key: 'gtm',
					name: 'Google Tag Manager',
					connected: !!settings.analytics?.gtmId,
					purpose:
						'Loads whatever tags you manage in GTM, and receives every shop event on its data layer.',
					vars: [],
					webhook: null
				},
				{
					key: 'ga4',
					name: 'Google Analytics',
					connected: !!settings.analytics?.ga4Id,
					purpose:
						'Traffic and ecommerce reporting. Leave it blank if Analytics is already loaded through Tag Manager.',
					vars: [],
					webhook: null
				}
			]
		},
		{
			title: 'Search',
			blurb: 'Typo-tolerant search. Without it the shop matches only what a shopper types exactly.',
			items: [
				{
					key: 'typesense',
					name: 'Typesense',
					connected: searchConfigured(),
					purpose:
						'Forgives spelling and ranks by relevance. The shop falls back to the database when this is off, so nothing breaks — searches just get stricter.',
					vars: ['TYPESENSE_HOST', 'TYPESENSE_PORT', 'TYPESENSE_PROTOCOL', 'TYPESENSE_API_KEY'],
					webhook: null
				}
			]
		},
		{
			title: 'File storage',
			blurb: 'Where uploaded product images live.',
			items: [
				{
					key: 'storage',
					name: env.STORAGE_DRIVER === 's3' ? 'S3-compatible bucket' : 'This server’s disk',
					connected: env.STORAGE_DRIVER === 's3',
					purpose:
						env.STORAGE_DRIVER === 's3'
							? 'Images are stored in your bucket.'
							: 'Fine while testing. On a hosted platform uploads are lost on each deploy — move to a bucket before going live.',
					vars: [
						'STORAGE_DRIVER=s3',
						'S3_ENDPOINT',
						'S3_BUCKET',
						'S3_ACCESS_KEY_ID',
						'S3_SECRET_ACCESS_KEY'
					],
					webhook: null
				}
			]
		}
	];

	return {
		groups,
		connected: groups.flatMap((g) => g.items).filter((i) => i.connected).length,
		total: groups.flatMap((g) => g.items).length
	};
};
