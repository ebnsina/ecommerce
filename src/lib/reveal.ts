/**
 * Reveals an element as it scrolls into view — once, then it stops watching.
 *
 * A Svelte action rather than a library: this is twenty lines and no bytes on
 * the wire, and these pages are read on mid-range Android phones over patchy
 * mobile data, where an animation library costs more than it gives back.
 *
 * The element starts hidden in CSS only when motion is allowed. If a browser
 * has no IntersectionObserver, or the visitor asked for reduced motion,
 * everything is simply visible from the start — the content never depends on
 * the animation running.
 */
type Options = {
	/** Stagger within a group, in ms. Kept small; this is punctuation, not choreography. */
	delay?: number;
};

export function reveal(node: HTMLElement, options: Options = {}) {
	const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
	if (reduced || typeof IntersectionObserver === 'undefined') {
		node.dataset.revealed = 'true';
		return {};
	}

	/* Anything already on screen when this runs is left alone. The server sent
	   it visible; hiding it now so it can fade back in is a flash, not an
	   entrance. Only what is still below the fold gets the treatment. */
	const box = node.getBoundingClientRect();
	if (box.top < window.innerHeight && box.bottom > 0) {
		node.dataset.revealed = 'true';
		return {};
	}

	node.dataset.reveal = '';
	if (options.delay) node.style.setProperty('--reveal-delay', `${options.delay}ms`);

	const observer = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (!entry.isIntersecting) continue;
				node.dataset.revealed = 'true';
				observer.disconnect();
			}
		},
		// A little before it arrives, so the movement finishes as it lands rather
		// than starting once the reader is already looking at it.
		{ rootMargin: '0px 0px -8% 0px', threshold: 0.05 }
	);

	observer.observe(node);
	return { destroy: () => observer.disconnect() };
}
