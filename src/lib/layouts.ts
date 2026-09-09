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
	/** The full category bar, or a slim bar that leans on search. */
	header: 'mega' | 'slim';
};

export const LAYOUTS: Record<LayoutKey, Layout> = {
	marketplace: {
		key: 'marketplace',
		label: 'Marketplace',
		note: 'Everything for everyone. A category bar, big banners, rails of deals.',
		card: 'square',
		grid: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
		header: 'mega'
	},
	grocery: {
		key: 'grocery',
		label: 'Grocery',
		note: 'Many small things, bought quickly. Tight cards, more of them in a row.',
		card: 'dense',
		grid: 'grid-cols-2 sm:grid-cols-4 lg:grid-cols-6',
		header: 'slim'
	},
	books: {
		key: 'books',
		label: 'Books',
		note: 'Covers are portrait, so the card is too, and the author sits under the title.',
		card: 'portrait',
		grid: 'grid-cols-2 sm:grid-cols-4 lg:grid-cols-6',
		header: 'slim'
	},
	tech: {
		key: 'tech',
		label: 'Electronics',
		note: 'A list, not a grid. Price first, because that is what is being compared.',
		card: 'row',
		grid: 'grid-cols-1 lg:grid-cols-2',
		header: 'mega'
	},
	editorial: {
		key: 'editorial',
		label: 'Lifestyle',
		note: 'Fewer products, larger pictures, room around everything.',
		card: 'square',
		grid: 'grid-cols-2 lg:grid-cols-3',
		header: 'slim'
	}
};

export const DEFAULT_LAYOUT: LayoutKey = 'marketplace';

export const isLayoutKey = (v: string | null | undefined): v is LayoutKey => !!v && v in LAYOUTS;

export const layoutOf = (v: string | null | undefined): Layout =>
	LAYOUTS[isLayoutKey(v) ? v : DEFAULT_LAYOUT];
