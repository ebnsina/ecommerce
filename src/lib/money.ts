/**
 * Money is stored as integer poisha (1 Tk = 100 poisha) everywhere — DB, cart,
 * orders. Never floats: 0.1 + 0.2 problems show up as one-poisha order mismatches.
 */
export type Poisha = number;

/**
 * Intl knows BDT — `narrowSymbol` yields ৳ rather than the "BDT" code, and the
 * fraction range drops a trailing .00 without any string surgery. Built once at
 * module scope: constructing a NumberFormat per call is measurably slow.
 *
 * Locale is pinned to en-BD on purpose: bn-BD renders Bengali digits (৪,৬৯৯) and
 * puts the symbol last, which fights the tabular Geist Mono numerals the design
 * uses. Revisit when a Bangla language toggle ships.
 */
const format = (fractionDigits: 0 | 2) =>
	new Intl.NumberFormat('en-BD', {
		style: 'currency',
		currency: 'BDT',
		currencyDisplay: 'narrowSymbol',
		minimumFractionDigits: fractionDigits,
		maximumFractionDigits: fractionDigits
	});

/* Two formatters, not one with a 0–2 range: that range renders 469.50 as
   "৳469.5", and money shows either no decimals or exactly two, never one. */
const wholeTaka = format(0);
const withPoisha = format(2);

/** 469900 -> "৳4,699"  ·  46950 -> "৳469.50" */
export function formatTk(poisha: Poisha): string {
	const rounded = Math.round(poisha);
	const formatter = rounded % 100 === 0 ? wholeTaka : withPoisha;
	return formatter.format(rounded / 100);
}

/** Whole-percent discount, rounded down. Returns 0 when there is no real saving. */
export function discountPercent(price: Poisha, compareAt: Poisha | null | undefined): number {
	if (!compareAt || compareAt <= price) return 0;
	return Math.floor(((compareAt - price) / compareAt) * 100);
}

/** Taka entered by an admin ("4699", "469.5") -> poisha. Throws on garbage. */
export function parseTk(input: string): Poisha {
	const t = input.trim().replace(/,/g, '');
	if (!/^-?\d+(\.\d{1,2})?$/.test(t)) throw new Error(`Invalid amount: ${input}`);
	return Math.round(parseFloat(t) * 100);
}
