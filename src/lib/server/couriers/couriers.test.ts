import { describe, it, expect } from 'vitest';
import { pipelineStatusFor } from './index';

/* Each courier writes its own status wording. This maps both onto our pipeline,
   and an unrecognised status must return null rather than guessing — a wrong
   guess here moves a real parcel to the wrong state. */
describe('pipelineStatusFor', () => {
	it('reads Steadfast wording', () => {
		expect(pipelineStatusFor('delivered')).toBe('delivered');
		expect(pipelineStatusFor('in_transit')).toBe('shipped');
		expect(pipelineStatusFor('cancelled')).toBe('returned');
		expect(pipelineStatusFor('partial_delivered')).toBe('delivered');
	});

	it('reads Pathao wording', () => {
		expect(pipelineStatusFor('Pickup_Requested')).toBe('shipped');
		expect(pipelineStatusFor('Assigned_for_Delivery')).toBe('shipped');
		expect(pipelineStatusFor('Delivered')).toBe('delivered');
		expect(pipelineStatusFor('Return')).toBe('returned');
	});

	it('returns null for anything it does not recognise', () => {
		expect(pipelineStatusFor('Pending')).toBeNull();
		expect(pipelineStatusFor('')).toBeNull();
		expect(pipelineStatusFor('something new')).toBeNull();
	});
});
