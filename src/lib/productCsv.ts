/** Column order shared by the product CSV export and import. */
export const PRODUCT_CSV_COLUMNS = [
	'slug',
	'title',
	'title_bn',
	'brand',
	'status',
	'price',
	'compare_at_price',
	'cost',
	'stock',
	'featured',
	'categories',
	'description',
	'seo_title',
	'seo_description'
] as const;
