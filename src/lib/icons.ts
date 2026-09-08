import type { Component } from 'svelte';

/**
 * Any icon component the app renders.
 *
 * Two libraries end up side by side — Lucide for interface icons, Simple Icons
 * for brand marks — and their prop types differ in the details. This is the
 * shape both satisfy and the only shape anything here calls them with, so a
 * map of icons can be typed without falling back to `any`.
 */
export type IconComponent = Component<{ size?: number; class?: string }>;
