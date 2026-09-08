import { describe, it, expect } from 'vitest';
import { sanitizeHtml } from './sanitize';

describe('sanitizeHtml', () => {
	it('keeps the formatting the editor produces', () => {
		const html = '<h2>Returns</h2><p>Within <strong>7 days</strong>.</p><ul><li>Unused</li></ul>';
		expect(sanitizeHtml(html)).toBe(html);
	});

	it('removes scripts along with their contents', () => {
		expect(sanitizeHtml('<p>ok</p><script>alert(1)</script>')).toBe('<p>ok</p>');
		expect(sanitizeHtml('<style>body{display:none}</style><p>hi</p>')).toBe('<p>hi</p>');
	});

	it('strips event handlers and unknown attributes', () => {
		expect(sanitizeHtml('<p onclick="steal()">hi</p>')).toBe('<p>hi</p>');
		expect(sanitizeHtml('<a href="/x" onmouseover="x()">go</a>')).toBe('<a href="/x">go</a>');
	});

	it('refuses executable and protocol-relative link targets', () => {
		expect(sanitizeHtml('<a href="javascript:alert(1)">x</a>')).toBe('<a>x</a>');
		expect(sanitizeHtml('<a href="//evil.com">x</a>')).toBe('<a>x</a>');
		expect(sanitizeHtml('<a href="https://ok.com">x</a>')).toBe('<a href="https://ok.com">x</a>');
		expect(sanitizeHtml('<a href="/pages/about">x</a>')).toBe('<a href="/pages/about">x</a>');
	});

	it('adds rel to links that open a new tab', () => {
		expect(sanitizeHtml('<a href="/x" target="_blank">x</a>')).toBe(
			'<a href="/x" target="_blank" rel="noopener noreferrer">x</a>'
		);
	});

	it('drops unknown tags but keeps their text', () => {
		expect(sanitizeHtml('<marquee>hello</marquee>')).toBe('hello');
		expect(sanitizeHtml('<img src=x onerror=alert(1)>')).toBe('');
	});

	it('closes tags the author left open', () => {
		expect(sanitizeHtml('<p>unclosed')).toBe('<p>unclosed</p>');
	});

	it('escapes stray angle brackets in text', () => {
		expect(sanitizeHtml('<p>5 < 10 & rising</p>')).toBe('<p>5 &lt; 10 &amp; rising</p>');
	});

	it('handles empty input', () => {
		expect(sanitizeHtml('')).toBe('');
	});
});
