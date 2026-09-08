import { describe, it, expect } from 'vitest';
import { pipelineStatusFor } from './index';

describe('pipelineStatusFor', () => {
	it('recognises the outcomes that matter', () => {
		expect(pipelineStatusFor('delivered')).toBe('delivered');
		expect(pipelineStatusFor('partial_delivered')).toBe('delivered');
		expect(pipelineStatusFor('cancelled')).toBe('returned');
		expect(pipelineStatusFor('return')).toBe('returned');
		expect(pipelineStatusFor('in_transit')).toBe('shipped');
	});

	it('is case insensitive', () => {
		expect(pipelineStatusFor('DELIVERED')).toBe('delivered');
	});

	it('leaves an unknown status alone rather than guessing', () => {
		expect(pipelineStatusFor('in_review')).toBeNull();
		expect(pipelineStatusFor('pending')).toBeNull();
		expect(pipelineStatusFor('')).toBeNull();
	});
});
