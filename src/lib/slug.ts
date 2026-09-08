/** URL slug from a title. Keeps Bengali as-is (browsers handle IRIs fine). */
export function slugify(input: string): string {
	return input
		.normalize('NFKD')
		.replace(/[̀-ͯ]/g, '') // strip latin accents
		.toLowerCase()
		.replace(/['’]/g, '')
		.replace(/[^\p{L}\p{N}\p{M}]+/gu, '-') // \p{M}: Bengali matras are marks, not letters
		.replace(/^-+|-+$/g, '')
		.slice(0, 80);
}

/** Appends -2, -3 … until the slug is free. */
export function uniqueSlug(base: string, taken: Set<string>): string {
	const slug = base || 'item';
	if (!taken.has(slug)) return slug;
	for (let n = 2; ; n++) {
		const candidate = `${slug}-${n}`;
		if (!taken.has(candidate)) return candidate;
	}
}
