/**
 * Positions a floating element against its trigger.
 *
 * Absolute positioning inside the trigger's own box is what clips a menu: any
 * ancestor with `overflow-hidden` — a rounded card, a scrolling table wrapper —
 * cuts it off. This pins the element to the viewport instead, so nothing can
 * clip it, then keeps it on screen: it opens downward when there is room and
 * flips up when there is not, and never runs off the left or right edge.
 */
export type AnchorOptions = {
	/** The element to sit against. */
	to: HTMLElement;
	/** Which edge of the trigger to line the menu up with. */
	align?: 'start' | 'end';
	/** Gap between trigger and menu, in px. */
	gap?: number;
	/** Match the trigger's width — what a select wants, a menu usually not. */
	matchWidth?: boolean;
	/** Preferred side. Overridden when the menu does not fit there. */
	prefer?: 'top' | 'bottom';
	/** Called with the side actually used, so the open animation can match. */
	onSide?: (side: 'top' | 'bottom') => void;
};

const MARGIN = 8;

export function anchored(node: HTMLElement, options: AnchorOptions) {
	let opts = options;

	function place() {
		const trigger = opts.to.getBoundingClientRect();
		const gap = opts.gap ?? 8;

		node.style.position = 'fixed';
		node.style.margin = '0';
		if (opts.matchWidth) node.style.width = `${trigger.width}px`;

		// Measured after the width is applied, since width changes the height.
		const menu = node.getBoundingClientRect();
		const below = window.innerHeight - trigger.bottom - gap - MARGIN;
		const above = trigger.top - gap - MARGIN;

		// Honour the caller's preference while it fits; otherwise take whichever
		// side has room, and only then fall back to the roomier one.
		const fits = { bottom: menu.height <= below, top: menu.height <= above };
		const prefer = opts.prefer ?? 'bottom';
		const other = prefer === 'bottom' ? 'top' : 'bottom';
		const side = fits[prefer] ? prefer : fits[other] ? other : below >= above ? 'bottom' : 'top';
		node.style.maxHeight = `${Math.max(120, side === 'bottom' ? below : above)}px`;
		node.style.top = side === 'bottom' ? `${trigger.bottom + gap}px` : '';
		node.style.bottom = side === 'top' ? `${window.innerHeight - trigger.top + gap}px` : '';

		const width = opts.matchWidth ? trigger.width : menu.width;
		const wanted = opts.align === 'end' ? trigger.right - width : trigger.left;
		const maxLeft = window.innerWidth - width - MARGIN;
		node.style.left = `${Math.max(MARGIN, Math.min(wanted, maxLeft))}px`;
		node.style.right = '';

		opts.onSide?.(side);
	}

	place();

	// `true` catches scrolling in any ancestor, not just the window — a menu
	// inside a scrollable panel has to travel with its trigger.
	window.addEventListener('scroll', place, true);
	window.addEventListener('resize', place);
	// Content can arrive after the first paint (a filtered list, a late image).
	const observer = new ResizeObserver(place);
	observer.observe(node);

	return {
		update(next: AnchorOptions) {
			opts = next;
			place();
		},
		destroy() {
			window.removeEventListener('scroll', place, true);
			window.removeEventListener('resize', place);
			observer.disconnect();
		}
	};
}
