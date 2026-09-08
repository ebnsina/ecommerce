import { describe, it, expect } from 'vitest';
import { renderMessage } from './recovery';

describe('renderMessage', () => {
	const vars = { name: 'Rahim', items: 3, store: 'Nokshi', link: 'https://s.test/cart/resume/abc' };

	it('fills every placeholder', () => {
		expect(renderMessage('{name}, {items} at {store}: {link}', vars)).toBe(
			'Rahim, 3 items at Nokshi: https://s.test/cart/resume/abc'
		);
	});

	it('says "1 item", not "1 items"', () => {
		expect(renderMessage('{items}', { ...vars, items: 1 })).toBe('1 item');
	});

	it('replaces a placeholder used twice', () => {
		expect(renderMessage('{store} — {store}', vars)).toBe('Nokshi — Nokshi');
	});

	it('leaves unknown placeholders alone rather than blanking them', () => {
		expect(renderMessage('hi {nickname}', vars)).toBe('hi {nickname}');
	});
});
