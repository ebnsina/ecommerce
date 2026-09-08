import { describe, it, expect } from 'vitest';
import { extensionFor, buildKey, keyFromUrl } from './storage';

describe('storage keys', () => {
	it('maps only image types to extensions', () => {
		expect(extensionFor('image/jpeg')).toBe('jpg');
		expect(extensionFor('image/svg+xml')).toBe('svg');
		expect(extensionFor('application/pdf')).toBeNull();
	});

	it('builds a dated, unique key', () => {
		const key = buildKey('image/png', new Date('2026-03-09T00:00:00Z'));
		expect(key).toMatch(/^uploads\/202603\/[0-9a-f-]{36}\.png$/);
		expect(buildKey('image/png')).not.toBe(buildKey('image/png'));
	});

	it('refuses to build a key for a non-image', () => {
		expect(() => buildKey('text/plain')).toThrow();
	});

	it('reverses a public URL back to its key, whatever the base', () => {
		expect(keyFromUrl('/uploads/a.png', '/uploads')).toBe('a.png');
		expect(
			keyFromUrl('https://cdn.example.com/uploads/202603/x.webp', 'https://cdn.example.com')
		).toBe('uploads/202603/x.webp');
		// trailing slashes on the base must not change the answer
		expect(keyFromUrl('https://cdn.example.com/k.png', 'https://cdn.example.com/')).toBe('k.png');
	});

	it('returns null for URLs that are not ours, so nothing foreign gets deleted', () => {
		expect(
			keyFromUrl('https://picsum.photos/seed/x/700/700', 'https://cdn.example.com')
		).toBeNull();
		expect(keyFromUrl('/static/logo.svg', '/uploads')).toBeNull();
	});
});
