/**
 * List pages keep their state in the URL: search, filters, page and page size.
 *
 * That makes every view linkable and shareable, survives a reload, and means
 * the server does the filtering — the browser never holds rows it did not ask
 * for, which is what keeps a 20,000-order table fast.
 */
import { goto } from '$app/navigation';
import { page } from '$app/state';
import { debounce } from '@tanstack/pacer';

export const PER_PAGE_OPTIONS = [10, 25, 50, 100];
export const DEFAULT_PER_PAGE = 10;

/** Reads the standard list parameters, with the defaults every page shares. */
export function listParams(url: URL) {
	const perPage = Number(url.searchParams.get('perPage') ?? DEFAULT_PER_PAGE);
	return {
		q: url.searchParams.get('q')?.trim() ?? '',
		page: Math.max(1, Number(url.searchParams.get('page') ?? 1)),
		perPage: PER_PAGE_OPTIONS.includes(perPage) ? perPage : DEFAULT_PER_PAGE
	};
}

/**
 * Applies a change to the query string. Any change other than the page itself
 * returns to page 1 — staying on page 7 of a filter that now has two results
 * shows an empty table and looks like a bug.
 */
export function setParams(patch: Record<string, string | number | null>) {
	const params = new URLSearchParams(page.url.searchParams);
	for (const [key, value] of Object.entries(patch)) {
		const v = value === null ? '' : String(value);
		if (!v) params.delete(key);
		else params.set(key, v);
	}
	if (!('page' in patch)) params.delete('page');
	const qs = params.toString();
	return goto(qs ? `?${qs}` : page.url.pathname, { keepFocus: true, noScroll: true });
}

/**
 * Typing must not fire a request per keystroke. 300ms is long enough to skip
 * the letters in the middle of a word and short enough to feel immediate.
 */
export const debouncedSetParams = debounce(setParams, { wait: 300 });
