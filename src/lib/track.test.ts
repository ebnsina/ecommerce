import { describe, it, expect } from 'vitest';
import { metaProps, tiktokProps, googleParams, purchaseEventId, type ShopEvent } from './track';

const purchase: ShopEvent = {
	kind: 'purchase',
	value: 249900, // ৳2,499
	orderId: '9a1f-uuid',
	orderNumber: '250907-0041',
	items: [{ id: 'p1', name: 'Electric Kettle', price: 124950, quantity: 2 }]
};

describe('vendor payloads', () => {
	// Every one of these takes decimal taka; sending poisha would inflate every
	// reported order by 100x and quietly ruin the ad bidding.
	it('converts poisha to taka for all three vendors', () => {
		expect(metaProps(purchase).value).toBe(2499);
		expect(tiktokProps(purchase).value).toBe(2499);
		expect(googleParams(purchase).value).toBe(2499);
	});

	it('converts item prices too', () => {
		expect(metaProps(purchase).contents?.[0].item_price).toBe(1249.5);
		expect(tiktokProps(purchase).contents?.[0].price).toBe(1249.5);
		expect(googleParams(purchase).items?.[0].price).toBe(1249.5);
	});

	it('uses each vendor’s own key names for a product line', () => {
		expect(tiktokProps(purchase).contents?.[0]).toMatchObject({
			content_id: 'p1',
			content_name: 'Electric Kettle',
			quantity: 2
		});
		expect(googleParams(purchase).items?.[0]).toMatchObject({
			item_id: 'p1',
			item_name: 'Electric Kettle',
			quantity: 2
		});
	});

	it('reports in taka', () => {
		expect(metaProps(purchase).currency).toBe('BDT');
		expect(tiktokProps(purchase).currency).toBe('BDT');
		expect(googleParams(purchase).currency).toBe('BDT');
	});

	it('gives Google the human order number as the transaction id', () => {
		expect(googleParams(purchase).transaction_id).toBe('250907-0041');
	});

	it('derives the same dedup key the server uses', () => {
		expect(purchaseEventId('9a1f-uuid')).toBe('purchase.9a1f-uuid');
	});

	it('omits value and items entirely when an event has neither', () => {
		const props = metaProps({ kind: 'search', searchTerm: 'kettle' });
		expect(props).not.toHaveProperty('value');
		expect(props).not.toHaveProperty('contents');
		expect(props.search_string).toBe('kettle');
	});

	it('sends a free item as 0, not as nothing', () => {
		expect(googleParams({ kind: 'view_item', value: 0 }).value).toBe(0);
	});
});
