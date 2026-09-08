/**
 * Motion constants for svelte/transition. Mirrors the CSS vars in layout.css.
 * Usage: <div transition:fade={fadeIn}> / transition:fly={flyUp}
 */
import { cubicOut } from 'svelte/easing';

export const DUR = 180;
export const DUR_SLOW = 280;

/** true when the OS asks for reduced motion (SSR-safe) */
export function reduced(): boolean {
	return (
		typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
	);
}

/** Duration that collapses to 0 when the user asked for reduced motion. */
function d(ms: number) {
	return reduced() ? 0 : ms;
}

export const fadeIn = () => ({ duration: d(DUR), easing: cubicOut });
export const flyUp = () => ({ y: 8, duration: d(DUR), easing: cubicOut });
export const flyDown = () => ({ y: -8, duration: d(DUR), easing: cubicOut });
export const slideOpen = () => ({ duration: d(DUR_SLOW), easing: cubicOut });
