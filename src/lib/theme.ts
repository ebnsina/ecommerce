/**
 * Store themes. Each preset is a full nine-stop ramp rather than a single hue
 * that gets lightened at runtime: the 700 stop is used for button labels and
 * links, so it has to clear 4.5:1 both as text on white and as a background
 * under white text. Every ramp here was measured against both.
 *
 * The tokens in layout.css derive from this ramp — --color-primary is
 * --color-brand-700 — so overriding the ramp re-themes the whole app.
 */
export type ThemeKey = 'blue' | 'emerald' | 'violet' | 'amber' | 'orange' | 'rose' | 'slate';
export type SurfaceKey = 'white' | 'warm';

export type Theme = { preset: ThemeKey; surface: SurfaceKey };

export const DEFAULT_THEME: Theme = { preset: 'blue', surface: 'white' };

type Ramp = readonly [string, string, string, string, string, string, string, string, string];

export const PRESETS: Record<ThemeKey, { label: string; ramp: Ramp }> = {
	blue: {
		label: 'Blue',
		ramp: [
			'#E3F2FD',
			'#BBDEFB',
			'#90CAF9',
			'#64B5F6',
			'#42A5F5',
			'#2196F3',
			'#1E88E5',
			'#1565C0',
			'#0D47A1'
		]
	},
	emerald: {
		label: 'Emerald',
		ramp: [
			'#ECFDF5',
			'#D1FAE5',
			'#A7F3D0',
			'#6EE7B7',
			'#34D399',
			'#10B981',
			'#059669',
			'#047857',
			'#065F46'
		]
	},
	violet: {
		label: 'Violet',
		ramp: [
			'#F5F3FF',
			'#EDE9FE',
			'#DDD6FE',
			'#C4B5FD',
			'#A78BFA',
			'#8B5CF6',
			'#7C3AED',
			'#6D28D9',
			'#5B21B6'
		]
	},
	amber: {
		label: 'Amber',
		ramp: [
			'#FFFBEB',
			'#FEF3C7',
			'#FDE68A',
			'#FCD34D',
			'#FBBF24',
			'#F59E0B',
			'#D97706',
			'#B45309',
			'#92400E'
		]
	},
	orange: {
		label: 'Orange',
		ramp: [
			'#FFF7ED',
			'#FFEDD5',
			'#FED7AA',
			'#FDBA74',
			'#FB923C',
			'#F97316',
			'#EA580C',
			'#C2410C',
			'#9A3412'
		]
	},
	rose: {
		label: 'Rose',
		ramp: [
			'#FFF1F2',
			'#FFE4E6',
			'#FECDD3',
			'#FDA4AF',
			'#FB7185',
			'#F43F5E',
			'#E11D48',
			'#BE123C',
			'#9F1239'
		]
	},
	slate: {
		// A neutral has no hue to collide with the others, and reads as premium on
		// a photo-heavy storefront.
		label: 'Graphite',
		ramp: [
			'#F8FAFC',
			'#F1F5F9',
			'#E2E8F0',
			'#CBD5E1',
			'#94A3B8',
			'#64748B',
			'#475569',
			'#334155',
			'#1E293B'
		]
	}
};

export type SurfaceTokens = {
	label: string;
	hint: string;
	page: string;
	surfaceAlt: string;
	border: string;
	ink: string;
	inkMuted: string;
	inkFaint: string;
};

/**
 * A surface is a whole neutral family, not just a page colour. Warming the page
 * while leaving cool slate panels and borders behind is what makes a theme look
 * mismatched, so both move together.
 *
 * Every value here is measured: muted ink clears 4.5:1 on its own panel, and the
 * border is visible against its page — a design that uses borders instead of
 * shadows cannot afford an invisible border.
 */
export const SURFACES: Record<SurfaceKey, SurfaceTokens> = {
	white: {
		label: 'White',
		hint: 'Crisp and clinical',
		page: '#FFFFFF',
		surfaceAlt: '#F8FAFC',
		border: '#D9E0E8',
		ink: '#0F172A',
		inkMuted: '#64748B',
		inkFaint: '#94A3B8'
	},
	warm: {
		// A soft neutral, not a beige. Warming a page with brown-grey borders reads
		// as dated; a near-white zinc keeps the softness and stays modern.
		label: 'Soft grey',
		hint: 'Softer than white; cards stay white',
		page: '#FAFAFA',
		surfaceAlt: '#F4F4F5',
		border: '#D9D9DE',
		ink: '#18181B',
		inkMuted: '#52525B',
		inkFaint: '#A1A1AA'
	}
};

export const normalizeTheme = (value: unknown): Theme => {
	const t = (value ?? {}) as Partial<Theme>;
	return {
		preset: t.preset && t.preset in PRESETS ? t.preset : DEFAULT_THEME.preset,
		surface: t.surface && t.surface in SURFACES ? t.surface : DEFAULT_THEME.surface
	};
};

/**
 * CSS variable overrides for a theme, injected into the document head so a
 * change applies everywhere at once with no rebuild.
 */
export function themeCss(theme: Theme): string {
	const { ramp } = PRESETS[theme.preset];
	const s = SURFACES[theme.surface];

	const stops = [50, 100, 200, 300, 400, 500, 600, 700, 800]
		.map((stop, i) => `--color-brand-${stop}:${ramp[i]}`)
		.join(';');

	// Cards keep --color-surface white in both modes, so a warm page makes them
	// read as raised rather than washing the whole screen out.
	const neutrals = [
		`--color-page:${s.page}`,
		`--color-surface-alt:${s.surfaceAlt}`,
		`--color-border:${s.border}`,
		`--color-ink:${s.ink}`,
		`--color-ink-muted:${s.inkMuted}`,
		`--color-ink-faint:${s.inkFaint}`
	].join(';');

	return `:root{${stops};${neutrals}}`;
}
