/**
 * What the shop connects to, in one place — the section on the page and the
 * column in the footer were drifting apart, one showing six marks and a
 * sentence listing the other five.
 *
 * Six brands have a published logo in the open icon set and ship as real files
 * under static/logos. The Bangladeshi five do not, and drawing someone else's
 * trademark from memory is not a thing to do on a page that sells trust, so
 * those carry a monogram until the real file arrives.
 *
 * ponytail: to promote one, drop static/logos/<slug>.svg in and give its row a
 * `logo`. Nothing else changes.
 *
 * Only services the shop already has an account with belong here. Our own
 * plumbing — the search engine, the database — is not an integration to a shop
 * owner; it is an implementation detail they should never have to read about.
 *
 * Logotypes are exempt from the contrast floor under WCAG 1.4.11, and every
 * mark is named in text beside it, so nothing depends on recognising a colour.
 */
export type Integration = { name: string; role: string; logo: string };

export const integrations: Integration[] = [
	{ name: 'Steadfast', role: 'Courier', logo: '' },
	{ name: 'Pathao', role: 'Courier', logo: '' },
	{ name: 'SSLCommerz', role: 'Payments', logo: '' },
	{ name: 'bKash', role: 'Payments', logo: '' },
	{ name: 'Nagad', role: 'Payments', logo: '' },
	{ name: 'Messenger', role: 'Messaging', logo: '/logos/messenger.svg' },
	{ name: 'WhatsApp', role: 'Messaging', logo: '/logos/whatsapp.svg' },
	{ name: 'Instagram', role: 'Messaging', logo: '/logos/instagram.svg' },
	{ name: 'Telegram', role: 'Messaging', logo: '/logos/telegram.svg' },
	{ name: 'Meta Pixel', role: 'Advertising', logo: '/logos/meta-pixel.svg' },
	{ name: 'TikTok', role: 'Advertising', logo: '/logos/tiktok.svg' }
];
