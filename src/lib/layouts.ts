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
	/** The narrowest a card may be in a product list, as a CSS length.
	    The list fills its container with as many of those as fit, so the same
	    layout works with a filter sidebar beside it, with the category rail, or
	    with neither — nothing has to know which page it is on. `100%` means one
	    per row, which is what a full-width row wants. */
	cardMin: string;
	/** How the top of the page is built.
	    `mega` spreads categories across a bar, `slim` folds them into a button,
	    `centered` drops the coloured bar for a white one with the name in the
	    middle — a shop that sells fewer things, more slowly. */
	header: 'mega' | 'slim' | 'centered' | 'grocery';
	/** A category rail down the left of the page, the way a grocer and a parts
	    dealer both do it — the list is the navigation, not a menu you open.
	    `icons` gives every row the category's own picture, which is how a
	    grocery shopper finds the aisle; `plain` is a text list, which is how a
	    parts dealer's does it. */
	rail: false | 'icons' | 'plain';
	/** The colour this shop wears when it is being shown as a demo. A store that
	    has chosen this layout in Settings keeps its own theme — see the shop's
	    layout load. Every value is an existing vetted preset from `$lib/theme`,
	    so contrast is already known good. */
	palette: 'blue' | 'emerald' | 'amber' | 'slate' | 'rose';
	/** A basket that stands on the page rather than behind an icon — a grocery
	    order is twenty small decisions, and hiding the running total behind a
	    click is what makes people abandon one. */
	basket: boolean;
	/** Scoped class on the shell. Retunes radius, ground and border weight —
	    see `layouts.css`. Colour and type are untouched. */
	shell: string;
};

export const LAYOUTS: Record<LayoutKey, Layout> = {
	marketplace: {
		key: 'marketplace',
		label: 'Marketplace',
		note: 'Blue on white. Everything for everyone: a category bar, big banners, rails of deals.',
		card: 'square',
		cardMin: '12rem',
		header: 'mega',
		rail: false,
		palette: 'blue',
		basket: false,
		shell: 'shop-marketplace'
	},
	grocery: {
		key: 'grocery',
		label: 'Grocery',
		note: 'Green, and worked like an app: aisles down one side, the basket open down the other, a plus on every card.',
		card: 'dense',
		cardMin: '9.5rem',
		header: 'grocery',
		rail: 'icons',
		palette: 'emerald',
		basket: true,
		shell: 'shop-grocery'
	},
	books: {
		key: 'books',
		label: 'Books',
		note: 'Amber on paper. Portrait covers, five to a row, the author under the title.',
		card: 'portrait',
		cardMin: '14rem',
		header: 'slim',
		rail: false,
		palette: 'amber',
		basket: false,
		shell: 'shop-books'
	},
	tech: {
		key: 'tech',
		label: 'Electronics',
		note: 'Graphite, square corners, grey ground. A list, not a grid: brand, reviews and stock beside the price.',
		card: 'row',
		cardMin: '100%',
		header: 'mega',
		rail: 'plain',
		palette: 'slate',
		basket: false,
		shell: 'shop-tech'
	},
	editorial: {
		key: 'editorial',
		label: 'Lifestyle',
		note: 'Rose, no coloured bar, no visible edges. The name centred, the categories spaced out, everything larger.',
		card: 'square',
		cardMin: '17rem',
		header: 'centered',
		rail: false,
		palette: 'rose',
		basket: false,
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
	// Dense cards live in the app shell, where a rail and a basket have already
	// taken 500px that a `lg:` viewport query knows nothing about — six across
	// left them at 108px with the stepper hanging out of the card.
	if (layout.card === 'dense') return 'sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5';
	if (layout.key === 'editorial') return 'lg:grid-cols-3';
	return columns === 4 ? 'sm:grid-cols-3 lg:grid-cols-4' : 'sm:grid-cols-3 lg:grid-cols-5';
}

/**
 * `grid-template-columns` for a product list.
 *
 * As many cards as fit, never narrower than the layout's minimum, and never
 * wider than the container — `min(…, 100%)` is what stops a 17rem minimum from
 * pushing a phone into a horizontal scroll.
 */
export const cardColumns = (key: string | null | undefined) =>
	`grid-template-columns: repeat(auto-fill, minmax(min(${layoutOf(key).cardMin}, 100%), 1fr))`;
