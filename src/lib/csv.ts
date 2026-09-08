/**
 * Minimal RFC 4180 CSV. Hand-rolled because the tricky parts — quoted fields
 * containing commas, escaped quotes, CRLF — are a dozen lines and fully testable,
 * and every product CSV a shop exports from Excel hits all three.
 */

/** Parses CSV text into rows of raw strings. Blank trailing lines are dropped. */
export function parseCsv(text: string): string[][] {
	const rows: string[][] = [];
	let row: string[] = [];
	let field = '';
	let quoted = false;
	let i = 0;

	// Excel writes a UTF-8 BOM; it would otherwise poison the first header.
	if (text.charCodeAt(0) === 0xfeff) i = 1;

	const endField = () => {
		row.push(field);
		field = '';
	};
	const endRow = () => {
		endField();
		if (row.length > 1 || row[0] !== '') rows.push(row);
		row = [];
	};

	while (i < text.length) {
		const c = text[i];

		if (quoted) {
			if (c === '"') {
				if (text[i + 1] === '"') {
					field += '"'; // escaped quote
					i += 2;
					continue;
				}
				quoted = false;
				i++;
				continue;
			}
			field += c;
			i++;
			continue;
		}

		if (c === '"') {
			quoted = true;
			i++;
		} else if (c === ',') {
			endField();
			i++;
		} else if (c === '\r') {
			i++; // CRLF — the \n does the work
		} else if (c === '\n') {
			endRow();
			i++;
		} else {
			field += c;
			i++;
		}
	}

	if (field !== '' || row.length) endRow();
	return rows;
}

/** Parses into objects keyed by the header row, trimming header names. */
export function parseCsvObjects(text: string): Record<string, string>[] {
	const [header, ...rows] = parseCsv(text);
	if (!header) return [];
	const keys = header.map((h) => h.trim().toLowerCase());
	return rows.map((r) => Object.fromEntries(keys.map((k, i) => [k, (r[i] ?? '').trim()])));
}

const cell = (v: unknown): string => {
	const s = v === null || v === undefined ? '' : String(v);
	return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** Serialises rows of objects using the given column order. */
export function toCsv(columns: string[], rows: Record<string, unknown>[]): string {
	const lines = [columns.map(cell).join(',')];
	for (const r of rows) lines.push(columns.map((c) => cell(r[c])).join(','));
	return lines.join('\r\n');
}
