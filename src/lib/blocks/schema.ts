/**
 * Field descriptors. The admin form is generated from these, so adding a block
 * means writing one component + one entry here — never a bespoke editor screen.
 * Plain objects rather than a validation library: the audience is trusted staff,
 * and every value round-trips through the same six input types.
 */
export type Field =
	| {
			key: string;
			type: 'text' | 'textarea' | 'link' | 'image';
			label: string;
			placeholder?: string;
			hint?: string;
	  }
	| { key: string; type: 'number'; label: string; min?: number; max?: number; hint?: string }
	| { key: string; type: 'boolean'; label: string; hint?: string }
	| {
			key: string;
			type: 'select';
			label: string;
			options: { value: string; label: string }[];
			hint?: string;
	  }
	| { key: string; type: 'images'; label: string; hint?: string }
	| { key: string; type: 'richtext'; label: string; hint?: string }
	| { key: string; type: 'source'; label: string; hint?: string }
	| {
			key: string;
			type: 'repeater';
			label: string;
			max?: number;
			itemKey: string;
			fields: Field[];
	  };

export type BlockDef = {
	type: string;
	name: string;
	description: string;
	defaults: Record<string, unknown>;
	fields: Field[];
};

/** Where a product list comes from. Shared by productSection and hotDeals. */
export type ProductSource = {
	mode: 'rule' | 'category' | 'manual';
	rule: 'new-arrival' | 'best-seller' | 'top-rated' | 'featured' | 'hot-deal';
	categoryId: string;
	ids: string[];
	limit: number;
};

export const defaultSource: ProductSource = {
	mode: 'rule',
	rule: 'new-arrival',
	categoryId: '',
	ids: [],
	limit: 10
};

const link = (key = 'href', label = 'Link') => ({
	key,
	type: 'link' as const,
	label,
	placeholder: '/c/electronics'
});

export const blockDefs: BlockDef[] = [
	{
		type: 'categoryStrip',
		name: 'Category strip',
		description: 'A row of category icons, right under the header.',
		defaults: { limit: 12 },
		fields: [{ key: 'limit', type: 'number', label: 'How many', min: 4, max: 20 }]
	},
	{
		type: 'heroSplit',
		name: 'Hero — big + tiles',
		description: 'One large slider on the left, up to four tiles on the right.',
		defaults: {
			slides: [{ image: '', href: '', alt: '' }],
			tiles: [],
			interval: 5,
			aspect: '16 / 7',
			layout: '1+1+2'
		},
		fields: [
			{
				key: 'slides',
				type: 'repeater',
				label: 'Slides',
				max: 8,
				itemKey: 'alt',
				fields: [
					{ key: 'image', type: 'image', label: 'Image' },
					link(),
					{ key: 'alt', type: 'text', label: 'Description', hint: 'Read aloud by screen readers.' }
				]
			},
			{
				key: 'tiles',
				type: 'repeater',
				label: 'Side tiles',
				max: 4,
				itemKey: 'alt',
				fields: [
					{ key: 'image', type: 'image', label: 'Image' },
					link(),
					{ key: 'alt', type: 'text', label: 'Description' }
				]
			},
			{
				key: 'aspect',
				type: 'select',
				label: 'Shape',
				hint: 'Every image is cropped to fill this frame, whatever size it was uploaded at.',
				options: [
					{ value: '16 / 5', label: 'Wide strip' },
					{ value: '16 / 7', label: 'Banner' },
					{ value: '16 / 9', label: 'Widescreen' },
					{ value: '3 / 1', label: 'Thin strip' },
					{ value: '2 / 1', label: 'Tall banner' }
				]
			},
			{ key: 'interval', type: 'number', label: 'Seconds per slide', min: 2, max: 20 },
			{
				key: 'layout',
				type: 'select',
				label: 'Tile layout',
				options: [
					{ value: '1+1+2', label: 'One, one, then two side by side' },
					{ value: '2x2', label: 'Two by two' }
				]
			}
		]
	},
	{
		type: 'policyStrip',
		name: 'Policy strip',
		description: 'Returns, privacy, delivery, support.',
		defaults: {
			items: [
				{
					icon: 'RotateCcw',
					title: 'বাতিলকরণ ও রিটার্ন',
					subtitle: 'Cancellation & Returns',
					href: '/pages/returns'
				}
			]
		},
		fields: [
			{
				key: 'items',
				type: 'repeater',
				label: 'Items',
				max: 5,
				itemKey: 'subtitle',
				fields: [
					{
						key: 'icon',
						type: 'select',
						label: 'Icon',
						options: [
							{ value: 'RotateCcw', label: 'Returns' },
							{ value: 'ShieldCheck', label: 'Shield' },
							{ value: 'Truck', label: 'Delivery' },
							{ value: 'Headphones', label: 'Support' },
							{ value: 'CreditCard', label: 'Payment' },
							{ value: 'BadgePercent', label: 'Offer' }
						]
					},
					{ key: 'title', type: 'text', label: 'Title' },
					{ key: 'subtitle', type: 'text', label: 'Subtitle' },
					link()
				]
			}
		]
	},
	{
		type: 'banner',
		name: 'Banner',
		description: 'One full-width image, or several as a slider.',
		defaults: {
			slides: [{ image: '', href: '', alt: '' }],
			contained: true,
			interval: 6,
			aspect: '3 / 1',
			background: 'none',
			heading: '',
			subtitle: '',
			cta: ''
		},
		fields: [
			{
				key: 'slides',
				type: 'repeater',
				label: 'Banners',
				max: 6,
				itemKey: 'alt',
				fields: [
					{ key: 'image', type: 'image', label: 'Image' },
					link(),
					{ key: 'alt', type: 'text', label: 'Description' }
				]
			},
			{
				key: 'heading',
				type: 'text',
				label: 'Heading',
				hint: 'Optional — shown over the background.'
			},
			{ key: 'subtitle', type: 'text', label: 'Subtitle' },
			{ key: 'cta', type: 'text', label: 'Button label' },
			{
				key: 'background',
				type: 'select',
				label: 'Background',
				hint: 'Gives the band its own colour so it stands apart from the rows around it.',
				options: [
					{ value: 'none', label: 'None' },
					{ value: 'soft', label: 'Soft blue' },
					{ value: 'tint', label: 'Blue tint' },
					{ value: 'accent', label: 'Bright blue' },
					{ value: 'brand', label: 'Primary blue' },
					{ value: 'ink', label: 'Dark' },
					{ value: 'sale', label: 'Red' }
				]
			},
			{
				key: 'aspect',
				type: 'select',
				label: 'Shape',
				hint: 'Every image is cropped to fill this frame, whatever size it was uploaded at.',
				options: [
					{ value: '16 / 5', label: 'Wide strip' },
					{ value: '16 / 7', label: 'Banner' },
					{ value: '16 / 9', label: 'Widescreen' },
					{ value: '3 / 1', label: 'Thin strip' },
					{ value: '2 / 1', label: 'Tall banner' }
				]
			},
			{ key: 'contained', type: 'boolean', label: 'Keep inside the page width' },
			{ key: 'interval', type: 'number', label: 'Seconds per slide', min: 2, max: 20 }
		]
	},
	{
		type: 'bannerGrid',
		name: 'Banner grid',
		description: 'Two to five banners in a row or two.',
		defaults: { banners: [], layout: '2+3' },
		fields: [
			{
				key: 'banners',
				type: 'repeater',
				label: 'Banners',
				max: 5,
				itemKey: 'alt',
				fields: [
					{ key: 'image', type: 'image', label: 'Image' },
					link(),
					{ key: 'alt', type: 'text', label: 'Description' }
				]
			},
			{
				key: 'layout',
				type: 'select',
				label: 'Layout',
				options: [
					{ value: '2-up', label: 'Two across' },
					{ value: '3-up', label: 'Three across' },
					{ value: '2+3', label: 'Two on top, three below' }
				]
			}
		]
	},
	{
		type: 'hotDeals',
		name: 'Hot deals',
		description: 'Two large deal cards plus a compact grid.',
		defaults: {
			heading: 'Hot Deals of the Day',
			href: '/search',
			source: { ...defaultSource, rule: 'hot-deal', limit: 10 },
			countdownTo: ''
		},
		fields: [
			{ key: 'heading', type: 'text', label: 'Heading' },
			link('href', '“More products” link'),
			{ key: 'source', type: 'source', label: 'Products' },
			{
				key: 'countdownTo',
				type: 'text',
				label: 'Countdown to',
				placeholder: '2026-09-19T23:59',
				hint: 'Leave empty for no timer.'
			}
		]
	},
	{
		type: 'productSection',
		name: 'Product row',
		description: 'Trending, new arrivals, featured, best sellers — one block, different source.',
		defaults: {
			heading: 'Trending Products',
			href: '/search',
			source: { ...defaultSource },
			columns: 5,
			cardSize: 'standard'
		},
		fields: [
			{ key: 'heading', type: 'text', label: 'Heading' },
			link('href', '“More products” link'),
			{ key: 'source', type: 'source', label: 'Products' },
			{
				key: 'columns',
				type: 'select',
				label: 'Columns',
				options: [
					{ value: '4', label: 'Four' },
					{ value: '5', label: 'Five' }
				]
			},
			{
				key: 'cardSize',
				type: 'select',
				label: 'Card size',
				options: [
					{ value: 'standard', label: 'Standard' },
					{ value: 'compact', label: 'Compact' }
				]
			}
		]
	},
	{
		type: 'productGrid',
		name: 'Product grid',
		description: 'A large multi-row grid — “Recommended for you”.',
		defaults: {
			heading: 'Recommended for you',
			href: '/search',
			source: { ...defaultSource, rule: 'best-seller', limit: 20 },
			columns: 5
		},
		fields: [
			{ key: 'heading', type: 'text', label: 'Heading' },
			link('href', '“More products” link'),
			{ key: 'source', type: 'source', label: 'Products' },
			{
				key: 'columns',
				type: 'select',
				label: 'Columns',
				options: [
					{ value: '4', label: 'Four' },
					{ value: '5', label: 'Five' }
				]
			}
		]
	},
	{
		type: 'brands',
		name: 'Brands',
		description: 'Top brands by product count, with sample images.',
		defaults: { heading: 'Top Weekly Brands', limit: 8 },
		fields: [
			{ key: 'heading', type: 'text', label: 'Heading' },
			{ key: 'limit', type: 'number', label: 'How many', min: 2, max: 16 }
		]
	},
	{
		type: 'categoryTiles',
		name: 'Category tiles',
		description: 'Shop-by-category row, driven by the category list.',
		defaults: { heading: 'Shop by category', limit: 6 },
		fields: [
			{ key: 'heading', type: 'text', label: 'Heading' },
			{ key: 'limit', type: 'number', label: 'How many', min: 2, max: 12 }
		]
	},
	{
		type: 'richText',
		name: 'Text section',
		description: 'Headings, paragraphs and lists — for policy and information pages.',
		defaults: { heading: '', body: '', width: 'narrow' },
		fields: [
			{ key: 'heading', type: 'text', label: 'Heading' },
			{ key: 'body', type: 'richtext', label: 'Content' },
			{
				key: 'width',
				type: 'select',
				label: 'Width',
				options: [
					{ value: 'narrow', label: 'Narrow — easier to read' },
					{ value: 'full', label: 'Full width' }
				]
			}
		]
	},
	{
		type: 'contactBand',
		name: 'Talk to us band',
		description: 'Call and chat buttons above the footer.',
		defaults: {
			heading: 'Questions? Talk to a real person.',
			subtitle: 'Call or message us and we will help you order — no account needed.',
			chatLabel: 'Order on WhatsApp',
			cta: '',
			ctaHref: ''
		},
		fields: [
			{ key: 'heading', type: 'text', label: 'Heading' },
			{ key: 'subtitle', type: 'text', label: 'Subtitle' },
			{
				key: 'phone',
				type: 'text',
				label: 'Phone number',
				hint: 'Leave blank to use the shop number from Settings.'
			},
			{
				key: 'whatsapp',
				type: 'text',
				label: 'WhatsApp number',
				hint: 'Leave blank to use the phone number above.'
			},
			{ key: 'chatLabel', type: 'text', label: 'Chat button label' },
			{ key: 'cta', type: 'text', label: 'Extra button label' },
			{ key: 'ctaHref', type: 'text', label: 'Extra button link' }
		]
	}
];

export const blockDef = (type: string) => blockDefs.find((b) => b.type === type);
