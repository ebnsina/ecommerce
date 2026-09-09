/**
 * Shop layouts.
 *
 * The same catalogue, the same colours and the same typeface, arranged the way
 * different kinds of shop arrange themselves. A grocer stacks many small things
 * in a dense grid; a bookshop shows tall covers; a parts dealer leads with the
 * price and a spec line; a lifestyle shop gives one product half the screen.
 *
 * This is deliberately not a theme. Colour and type already have their own
 * settings and are shared across every layout — what changes here is shape:
 * how a product card is proportioned, how many fit a row, and how much chrome
 * the header carries.
 *
 * ponytail: a record, not a plugin system. Five layouts is not enough to earn
 * an interface, and a sixth is four lines.
 */

export type LayoutKey = 'marketplace' | 'grocery' | 'books' | 'tech' | 'editorial';

/** How a product renders in a list. */
export type CardShape = 'square' | 'dense' | 'portrait' | 'row';

export type Layout = {
	key: LayoutKey;
	label: string;
	/** One line for the admin, so the choice is not a guess. */
	note: string;
	card: CardShape;
	/** Tailwind grid classes for a full-width product list, phone up. */
	grid: string;
	/** How the top of the page is built.
	    `mega` spreads categories across a bar, `slim` folds them into a button,
	    `centered` drops the coloured bar for a white one with the name in the
	    middle — a shop that sells fewer things, more slowly. */
	header: 'mega' | 'slim' | 'centered';
	/** A category rail down the left of the page, the way a grocer and a parts
	    dealer both do it — the list is the navigation, not a menu you open.
	    `icons` gives every row the category's own picture, which is how a
	    grocery shopper finds the aisle; `plain` is a text list, which is how a
	    parts dealer's does it. */
	rail: false | 'icons' | 'plain';
	/** Scoped class on the shell. Retunes radius, ground and border weight —
	    see `layouts.css`. Colour and type are untouched. */
	shell: string;
};

export const LAYOUTS: Record<LayoutKey, Layout> = {
	marketplace: {
		key: 'marketplace',
		label: 'Marketplace',
		note: 'Everything for everyone. A category bar, big banners, rails of deals on white.',
		card: 'square',
		grid: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
		header: 'mega',
		rail: false,
		shell: 'shop-marketplace'
	},
	grocery: {
		key: 'grocery',
		label: 'Grocery',
		note: 'Many small things, bought quickly. A standing category rail, small square corners, a plus on every card.',
		card: 'dense',
		grid: 'grid-cols-2 sm:grid-cols-4 lg:grid-cols-6',
		header: 'slim',
		rail: 'icons',
		shell: 'shop-grocery'
	},
	books: {
		key: 'books',
		label: 'Books',
		note: 'Paper-coloured ground, portrait covers six to a row, the author under the title.',
		card: 'portrait',
		grid: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
		header: 'slim',
		rail: false,
		shell: 'shop-books'
	},
	tech: {
		key: 'tech',
		label: 'Electronics',
		note: 'Square corners on a grey ground. A list, not a grid: brand, reviews and stock beside the price.',
		card: 'row',
		grid: 'grid-cols-1',
		header: 'mega',
		rail: 'plain',
		shell: 'shop-tech'
	},
	editorial: {
		key: 'editorial',
		label: 'Lifestyle',
		note: 'No coloured bar and no visible edges. The name centred, the categories spaced out, everything larger.',
		card: 'square',
		grid: 'grid-cols-2 lg:grid-cols-3',
		header: 'centered',
		rail: false,
		shell: 'shop-editorial'
	}
};

export const DEFAULT_LAYOUT: LayoutKey = 'marketplace';

export const isLayoutKey = (v: string | null | undefined): v is LayoutKey => !!v && v in LAYOUTS;

export const layoutOf = (v: string | null | undefined): Layout =>
	LAYOUTS[isLayoutKey(v) ? v : DEFAULT_LAYOUT];

/**
 * The grid for a product row inside a page block.
 *
 * The block's own `columns` is what the person editing the page asked for, but
 * it was chosen against square cards: the same number of portrait covers is a
 * wall of enormous books, and the same number of full-width rows does not fit
 * at all. So the layout has the last word on how many go across, and the
 * block's choice stands only where it still makes sense.
 */
export function sectionGrid(key: string | null | undefined, columns: number): string {
	const layout = layoutOf(key);
	if (layout.card === 'row') return 'lg:grid-cols-2';
	if (layout.card === 'portrait') return 'sm:grid-cols-3 lg:grid-cols-5';
	if (layout.card === 'dense') return 'sm:grid-cols-4 lg:grid-cols-6';
	if (layout.key === 'editorial') return 'lg:grid-cols-3';
	return columns === 4 ? 'sm:grid-cols-3 lg:grid-cols-4' : 'sm:grid-cols-3 lg:grid-cols-5';
}
