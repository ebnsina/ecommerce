/** Background choices shared by banner-ish blocks. Tokens only — no raw hex. */
export const backgrounds: Record<string, string> = {
	none: '',
	soft: 'bg-brand-50 text-ink',
	tint: 'bg-brand-100 text-ink',
	accent: 'bg-brand-300 text-ink',
	brand: 'bg-primary text-white',
	ink: 'bg-ink text-white',
	sale: 'bg-sale text-white'
};

export const bg = (key: string | undefined) => backgrounds[key ?? 'none'] ?? '';

/** True when the band is dark enough that muted ink would disappear on it. */
export const isDark = (key: string | undefined) =>
	key === 'brand' || key === 'ink' || key === 'sale';
