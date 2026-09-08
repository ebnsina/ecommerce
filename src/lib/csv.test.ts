import { describe, it, expect } from 'vitest';
import { parseCsv, parseCsvObjects, toCsv } from './csv';

describe('parseCsv', () => {
	it('handles quoted fields with commas, quotes and newlines', () => {
		const text = 'a,b,c\n1,"two, and a half","he said ""hi"""\n';
		expect(parseCsv(text)).toEqual([
			['a', 'b', 'c'],
			['1', 'two, and a half', 'he said "hi"']
		]);
	});

	it('handles CRLF and a trailing newline', () => {
		expect(parseCsv('x,y\r\n1,2\r\n')).toEqual([
			['x', 'y'],
			['1', '2']
		]);
	});

	it('keeps a newline inside a quoted field', () => {
		expect(parseCsv('a\n"line1\nline2"')).toEqual([['a'], ['line1\nline2']]);
	});

	it('strips the Excel BOM from the first header', () => {
		expect(parseCsv('﻿slug,title\na,b')[0]).toEqual(['slug', 'title']);
	});

	it('keeps empty fields rather than collapsing them', () => {
		expect(parseCsv('a,,c')).toEqual([['a', '', 'c']]);
	});
});

describe('parseCsvObjects', () => {
	it('keys rows by a normalised header', () => {
		expect(parseCsvObjects(' Slug , Title \nrice,Rice 5kg')).toEqual([
			{ slug: 'rice', title: 'Rice 5kg' }
		]);
	});

	it('fills missing trailing columns with empty strings', () => {
		expect(parseCsvObjects('a,b,c\n1,2')).toEqual([{ a: '1', b: '2', c: '' }]);
	});
});

describe('toCsv', () => {
	it('quotes only what needs quoting and round-trips', () => {
		const csv = toCsv(['slug', 'title'], [{ slug: 'a', title: 'Rice, 5kg "best"' }]);
		expect(csv).toBe('slug,title\r\na,"Rice, 5kg ""best"""');
		expect(parseCsvObjects(csv)).toEqual([{ slug: 'a', title: 'Rice, 5kg "best"' }]);
	});

	it('renders null and undefined as empty, not as the words', () => {
		expect(toCsv(['a', 'b'], [{ a: null, b: undefined }])).toBe('a,b\r\n,');
	});
});
