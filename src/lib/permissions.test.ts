import { describe, it, expect } from 'vitest';
import { mayVisit } from './permissions';

describe('mayVisit', () => {
	it('keeps the owner out of nothing', () => {
		expect(mayVisit('/admin/settings', 'owner')).toBe(true);
		expect(mayVisit('/admin/integrations', 'owner')).toBe(true);
	});

	it('closes settings and integrations to the other roles', () => {
		expect(mayVisit('/admin/settings', 'manager')).toBe(false);
		expect(mayVisit('/admin/integrations', 'staff')).toBe(false);
		// Sub-paths too — a form action lives under one.
		expect(mayVisit('/admin/settings/theme', 'staff')).toBe(false);
	});

	it('leaves the daily work open to everyone', () => {
		expect(mayVisit('/admin/orders', 'staff')).toBe(true);
		expect(mayVisit('/admin/products/new', 'staff')).toBe(true);
		// Not a prefix match on the name: this is a different section.
		expect(mayVisit('/admin/settings-export', 'staff')).toBe(true);
	});
});
