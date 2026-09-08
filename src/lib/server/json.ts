/**
 * A JSON body from somebody else's API.
 *
 * Courier, gateway and platform responses arrive as whatever that vendor felt
 * like sending, and their shapes change without warning. Reading them through
 * `unknown` would mean a narrowing dance at every field for no real safety —
 * the check that matters is the one on the value we actually use, which each
 * caller already does.
 *
 * So the looseness is admitted once, here, with a name that says what it is,
 * rather than spelled `Record<string, any>` in a dozen files.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- see above
export type JsonBody = Record<string, any>;
