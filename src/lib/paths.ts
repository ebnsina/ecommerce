/**
 * Where the shop lives.
 *
 * The root of this deployment is the page that explains the product, so the
 * shop itself is mounted one level down. Everything shopper-facing builds its
 * links from here rather than writing the prefix out, so moving the shop again
 * is one edit.
 */
export const SHOP = '/demo';

/** `shop('/cart')` → `/demo/cart`. Pass a path that starts with a slash. */
export const shop = (path = '') => `${SHOP}${path}`;
