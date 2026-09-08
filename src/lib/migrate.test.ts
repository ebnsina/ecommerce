import { describe, it, expect } from 'vitest';
import { detectFormat, mapRows } from './migrate';
import { parseCsvObjects } from './csv';

describe('detectFormat', () => {
	it('recognises a Shopify export', () => {
		expect(detectFormat(['Handle', 'Title', 'Body (HTML)', 'Vendor', 'Variant Price'])).toBe(
			'shopify'
		);
	});

	it('recognises a WooCommerce export', () => {
		expect(detectFormat(['ID', 'Type', 'SKU', 'Name', 'Regular price', 'Categories'])).toBe(
			'woocommerce'
		);
	});

	it('falls back to native for our own columns', () => {
		expect(detectFormat(['slug', 'title', 'price', 'stock'])).toBe('native');
	});
});

describe('shopify mapping', () => {
	const csv = [
		'Handle,Title,Body (HTML),Vendor,Type,Published,Option1 Name,Option1 Value,Variant SKU,Variant Inventory Qty,Variant Price,Variant Compare At Price,Image Src',
		'cotton-tee,Cotton Tee,"<p>Soft &amp; light</p>",Winner,Fashion,TRUE,Size,S,TEE-S,5,450,600,https://cdn/x/1.jpg',
		'cotton-tee,,,,,,Size,M,TEE-M,3,450,,https://cdn/x/2.jpg',
		'cotton-tee,,,,,,Size,L,TEE-L,0,450,,'
	].join('\n');

	const [item] = mapRows('shopify', parseCsvObjects(csv));

	it('collapses the variant rows into one product', () => {
		expect(item.slug).toBe('cotton-tee');
		expect(item.title).toBe('Cotton Tee');
		expect(item.brand).toBe('Winner');
		expect(item.price).toBe('450');
		expect(item.compare_at_price).toBe('600');
	});

	it('strips HTML and decodes entities from the body', () => {
		expect(item.description).toBe('Soft & light');
	});

	it('gathers images and option values across the grouped rows', () => {
		expect(item.images).toEqual(['https://cdn/x/1.jpg', 'https://cdn/x/2.jpg']);
		expect(item.options).toEqual({ Size: ['S', 'M', 'L'] });
	});
});

describe('woocommerce mapping', () => {
	const csv = [
		'ID,Type,SKU,Name,Published,Regular price,Sale price,Stock,Categories,Images,Description',
		'12,simple,RICE-5,Rice 5kg,1,500,450,20,"Grocery > Rice, Offers","https://cdn/a.jpg, https://cdn/b.jpg",<p>Best rice</p>',
		'13,variation,RICE-5-A,Rice variation,1,500,,5,Grocery,,'
	].join('\n');

	const rows = mapRows('woocommerce', parseCsvObjects(csv));

	it('skips variation rows', () => {
		expect(rows).toHaveLength(1);
	});

	it('treats the sale price as the live price', () => {
		expect(rows[0].price).toBe('450');
		expect(rows[0].compare_at_price).toBe('500');
	});

	it('keeps the leaf of a nested category path', () => {
		expect(rows[0].categories).toBe('Rice;Offers');
	});

	it('splits the image cell into separate URLs', () => {
		expect(rows[0].images).toEqual(['https://cdn/a.jpg', 'https://cdn/b.jpg']);
	});
});
