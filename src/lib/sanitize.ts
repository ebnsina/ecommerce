/**
 * HTML allowlist for CMS rich text.
 *
 * The editor already constrains what a staff member can produce, but stored HTML
 * is rendered with {@html}, so it is sanitised again on the way out: a
 * compromised staff account must not be able to plant a script in every page.
 * Allowlist, never denylist — an unknown tag is dropped, not permitted.
 */
const ALLOWED_TAGS = new Set([
	'p',
	'br',
	'strong',
	'b',
	'em',
	'i',
	's',
	'u',
	'code',
	'pre',
	'h2',
	'h3',
	'h4',
	'ul',
	'ol',
	'li',
	'blockquote',
	'a',
	'hr'
]);

/** Attributes permitted per tag. Everything else is stripped, `on*` included. */
const ALLOWED_ATTRS: Record<string, Set<string>> = {
	a: new Set(['href', 'title', 'target', 'rel'])
};

/** javascript:, data:, vbscript: — anything that executes when clicked. */
function safeHref(value: string): string | null {
	const url = value.trim();
	if (/^(https?:|mailto:|tel:)/i.test(url)) return url;
	// Relative links stay, but never protocol-relative (//evil.com).
	if (url.startsWith('/') && !url.startsWith('//')) return url;
	if (url.startsWith('#')) return url;
	return null;
}

/** `"` matters as much as `<`: attribute values are re-emitted wrapped in
    double quotes, so an unescaped one closes the attribute and everything
    after it — `onmouseover=` included — becomes markup. */
const escapeText = (s: string) =>
	s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function sanitizeHtml(input: string): string {
	if (!input) return '';

	// Drop whole dangerous elements including their content, not just the tags.
	let html = input.replace(
		/<(script|style|iframe|object|embed|template|noscript)\b[\s\S]*?<\/\1\s*>/gi,
		''
	);
	html = html.replace(/<!--[\s\S]*?-->/g, '');

	const out: string[] = [];
	const openTags: string[] = [];
	// The trailing `(<)` catches a bare angle bracket in prose ("5 < 10"); without
	// it the character is silently dropped rather than escaped.
	const token = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>|([^<]+)|(<)/g;

	let match: RegExpExecArray | null;
	while ((match = token.exec(html))) {
		const [raw, tagName, rawAttrs, text, strayAngle] = match;

		if (text !== undefined) {
			out.push(escapeText(text));
			continue;
		}
		if (strayAngle !== undefined) {
			out.push('&lt;');
			continue;
		}

		const tag = tagName.toLowerCase();
		if (!ALLOWED_TAGS.has(tag)) continue; // unknown tag: drop the tag, keep going

		if (raw.startsWith('</')) {
			const i = openTags.lastIndexOf(tag);
			if (i === -1) continue; // stray close tag
			openTags.splice(i, 1);
			out.push(`</${tag}>`);
			continue;
		}

		const attrs: string[] = [];
		const allowed = ALLOWED_ATTRS[tag];
		if (allowed) {
			const attrRe = /([a-zA-Z-]+)\s*=\s*"([^"]*)"|([a-zA-Z-]+)\s*=\s*'([^']*)'/g;
			let a: RegExpExecArray | null;
			while ((a = attrRe.exec(rawAttrs ?? ''))) {
				const name = (a[1] ?? a[3]).toLowerCase();
				const value = a[2] ?? a[4] ?? '';
				if (!allowed.has(name)) continue;

				if (name === 'href') {
					const href = safeHref(value);
					if (!href) continue;
					attrs.push(`href="${escapeText(href)}"`);
				} else {
					attrs.push(`${name}="${escapeText(value)}"`);
				}
			}
			// Anything opening a new tab must not be able to reach back.
			if (tag === 'a' && attrs.some((x) => x.startsWith('target=')))
				attrs.push('rel="noopener noreferrer"');
		}

		const selfClosing = tag === 'br' || tag === 'hr';
		if (!selfClosing) openTags.push(tag);
		out.push(`<${tag}${attrs.length ? ' ' + attrs.join(' ') : ''}>`);
	}

	// Close anything the author left open so the surrounding page cannot break.
	for (const tag of openTags.reverse()) out.push(`</${tag}>`);
	return out.join('');
}
