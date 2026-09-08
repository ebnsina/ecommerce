/**
 * Guided tours for the admin.
 *
 * The people running this shop are not developers, and a page-building screen
 * is the hardest thing in here to meet cold. Each tour runs itself once, the
 * first time someone opens that page, and stays available from the Help button
 * in the header for anyone who wants it again.
 *
 * Progress is per browser: this is a nicety, not a record worth a table.
 */
import { driver, type DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';

export type Tour = { key: string; steps: DriveStep[] };

const seenKey = (key: string) => `tour:${key}`;

export function hasSeen(key: string) {
	try {
		return localStorage.getItem(seenKey(key)) === '1';
	} catch {
		// Private windows and blocked storage throw. A tour that runs twice is a
		// far smaller problem than a page that will not load.
		return false;
	}
}

function markSeen(key: string) {
	try {
		localStorage.setItem(seenKey(key), '1');
	} catch {
		/* nothing to do */
	}
}

export function runTour(tour: Tour) {
	// Steps whose element is not on the page are dropped rather than shown
	// floating in the middle of the screen, which is what driver.js does with a
	// missing selector.
	const steps = tour.steps.filter(
		(s) => typeof s.element !== 'string' || document.querySelector(s.element)
	);
	if (!steps.length) return;

	driver({
		steps,
		showProgress: true,
		allowClose: true,
		nextBtnText: 'Next',
		prevBtnText: 'Back',
		doneBtnText: 'Got it',
		popoverClass: 'admin-tour',
		onDestroyed: () => markSeen(tour.key)
	}).drive();
}

/** Runs the tour the first time this browser opens the page. */
export function runTourOnce(tour: Tour) {
	if (hasSeen(tour.key)) return;
	// One frame, so the page has painted and every step's element exists.
	requestAnimationFrame(() => runTour(tour));
}
