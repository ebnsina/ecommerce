import { relations, sql } from 'drizzle-orm';
import {
	pgTable,
	pgEnum,
	uuid,
	text,
	integer,
	boolean,
	timestamp,
	jsonb,
	index,
	uniqueIndex,
	primaryKey,
	serial
} from 'drizzle-orm/pg-core';

/* Money is integer poisha everywhere (see $lib/money.ts). Never numeric/float. */
const poisha = (name: string) => integer(name);
const now = () => timestamp({ withTimezone: true }).defaultNow().notNull();
const id = () => uuid().primaryKey().defaultRandom();

/* ── enums ───────────────────────────────────────────────────────────── */
export const adminRole = pgEnum('admin_role', ['owner', 'manager', 'staff']);
export const productStatus = pgEnum('product_status', ['draft', 'active', 'archived']);
export const orderStatus = pgEnum('order_status', [
	'pending', // placed, nobody has called yet
	'confirmed', // customer confirmed on the phone
	'packed',
	'shipped',
	'delivered',
	'returned', // RTO — courier brought it back
	'cancelled'
]);
export const paymentMethod = pgEnum('payment_method', ['cod', 'sslcommerz']);
export const paymentStatus = pgEnum('payment_status', ['unpaid', 'paid', 'refunded', 'failed']);
export const couponType = pgEnum('coupon_type', ['percent', 'fixed', 'free_shipping']);
export const deliveryZone = pgEnum('delivery_zone', [
	'inside_dhaka',
	'suburban_dhaka',
	'outside_dhaka'
]);

/* ── staff, sessions, otp ────────────────────────────────────────────── */
export const adminUsers = pgTable('admin_users', {
	id: id(),
	name: text().notNull(),
	email: text().notNull().unique(),
	passwordHash: text('password_hash').notNull(),
	role: adminRole().notNull().default('staff'),
	active: boolean().notNull().default(true),
	createdAt: now()
});

export const customers = pgTable(
	'customers',
	{
		id: id(),
		phone: text().notNull().unique(), // 01XXXXXXXXX — the account identity
		name: text(),
		email: text(),
		passwordHash: text('password_hash'), // only used when OTP is switched off
		phoneVerified: boolean('phone_verified').notNull().default(false),
		notes: text(),
		tags: text()
			.array()
			.notNull()
			.default(sql`'{}'`),
		createdAt: now()
	},
	(t) => [index('customers_created_idx').on(t.createdAt)]
);

/** One session table for both audiences; exactly one of the two ids is set. */
export const sessions = pgTable(
	'sessions',
	{
		id: text().primaryKey(), // random token, hashed before storing
		adminUserId: uuid('admin_user_id').references(() => adminUsers.id, { onDelete: 'cascade' }),
		customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'cascade' }),
		expiresAt: timestamp('expires_at', { withTimezone: true }).notNull()
	},
	(t) => [index('sessions_customer_idx').on(t.customerId)]
);

export const otpCodes = pgTable(
	'otp_codes',
	{
		id: serial().primaryKey(),
		phone: text().notNull(),
		codeHash: text('code_hash').notNull(),
		attempts: integer().notNull().default(0),
		expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
		createdAt: now()
	},
	(t) => [index('otp_phone_idx').on(t.phone, t.createdAt)]
);

/** Shared throttle for OTP sends, OTP checks and admin logins.
    In Postgres rather than memory so it holds across serverless instances. */
export const rateLimits = pgTable('rate_limits', {
	key: text().primaryKey(), // e.g. 'otp:send:01712345678' or 'admin:login:1.2.3.4'
	count: integer().notNull().default(0),
	resetAt: timestamp('reset_at', { withTimezone: true }).notNull()
});

/* ── media ───────────────────────────────────────────────────────────── */
export const media = pgTable('media', {
	id: id(),
	url: text().notNull(),
	alt: text(),
	width: integer(),
	height: integer(),
	sizeBytes: integer('size_bytes'),
	createdAt: now()
});

/* ── catalog ─────────────────────────────────────────────────────────── */
export const categories = pgTable(
	'categories',
	{
		id: id(),
		parentId: uuid('parent_id'),
		name: text().notNull(),
		nameBn: text('name_bn'),
		slug: text().notNull().unique(),
		image: text(),
		icon: text(),
		sort: integer().notNull().default(0),
		visible: boolean().notNull().default(true)
	},
	(t) => [index('categories_parent_idx').on(t.parentId, t.sort)]
);

export const products = pgTable(
	'products',
	{
		id: id(),
		title: text().notNull(),
		titleBn: text('title_bn'),
		slug: text().notNull().unique(),
		description: text(),
		descriptionBn: text('description_bn'),
		brand: text(),
		status: productStatus().notNull().default('draft'),
		price: poisha('price').notNull(),
		compareAtPrice: poisha('compare_at_price'),
		cost: poisha('cost'),
		stock: integer().notNull().default(0), // used when hasVariants = false
		hasVariants: boolean('has_variants').notNull().default(false),
		featured: boolean().notNull().default(false),
		rating: integer().notNull().default(0), // 0–50, i.e. 45 = 4.5 stars
		reviewCount: integer('review_count').notNull().default(0),
		soldCount: integer('sold_count').notNull().default(0), // powers best-seller
		seoTitle: text('seo_title'),
		seoDescription: text('seo_description'),
		createdAt: now(),
		updatedAt: now()
	},
	(t) => [
		index('products_status_idx').on(t.status, t.createdAt),
		index('products_title_trgm').using('gin', sql`${t.title} gin_trgm_ops`)
	]
);

export const productImages = pgTable(
	'product_images',
	{
		id: id(),
		productId: uuid('product_id')
			.notNull()
			.references(() => products.id, { onDelete: 'cascade' }),
		url: text().notNull(),
		alt: text(),
		sort: integer().notNull().default(0)
	},
	(t) => [index('product_images_product_idx').on(t.productId, t.sort)]
);

export const productCategories = pgTable(
	'product_categories',
	{
		productId: uuid('product_id')
			.notNull()
			.references(() => products.id, { onDelete: 'cascade' }),
		categoryId: uuid('category_id')
			.notNull()
			.references(() => categories.id, { onDelete: 'cascade' })
	},
	(t) => [primaryKey({ columns: [t.productId, t.categoryId] })]
);

/** Max 2 per product (e.g. Size, Color) — enforced in the admin, not the DB. */
export const productOptions = pgTable('product_options', {
	id: id(),
	productId: uuid('product_id')
		.notNull()
		.references(() => products.id, { onDelete: 'cascade' }),
	name: text().notNull(),
	values: text().array().notNull(),
	sort: integer().notNull().default(0)
});

export const variants = pgTable(
	'variants',
	{
		id: id(),
		productId: uuid('product_id')
			.notNull()
			.references(() => products.id, { onDelete: 'cascade' }),
		sku: text(),
		/** { "Size": "L", "Color": "Red" } */
		optionValues: jsonb('option_values').$type<Record<string, string>>().notNull().default({}),
		price: poisha('price').notNull(),
		compareAtPrice: poisha('compare_at_price'),
		stock: integer().notNull().default(0),
		image: text(),
		active: boolean().notNull().default(true)
	},
	(t) => [index('variants_product_idx').on(t.productId)]
);

export const productReviews = pgTable(
	'product_reviews',
	{
		id: id(),
		productId: uuid('product_id')
			.notNull()
			.references(() => products.id, { onDelete: 'cascade' }),
		customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'set null' }),
		authorName: text('author_name').notNull(),
		rating: integer().notNull(), // 1–5
		title: text(),
		body: text(),
		approved: boolean().notNull().default(false), // staff moderate before it shows
		createdAt: now()
	},
	(t) => [index('reviews_product_idx').on(t.productId, t.approved)]
);

export const productQuestions = pgTable(
	'product_questions',
	{
		id: id(),
		productId: uuid('product_id')
			.notNull()
			.references(() => products.id, { onDelete: 'cascade' }),
		customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'set null' }),
		authorName: text('author_name').notNull(),
		question: text().notNull(),
		answer: text(),
		answeredAt: timestamp('answered_at', { withTimezone: true }),
		answeredBy: uuid('answered_by').references(() => adminUsers.id, { onDelete: 'set null' }),
		createdAt: now()
	},
	(t) => [index('questions_product_idx').on(t.productId, t.createdAt)]
);

/* ── bundles ─────────────────────────────────────────────────────────── */

/**
 * A bundle is a fixed set of products sold together for one price.
 *
 * Adding one to the cart adds its items with their unit prices scaled so the
 * line total equals the bundle price. Orders therefore need no bundle concept
 * at all — every order line still carries its own snapshot price.
 */
export const bundles = pgTable('bundles', {
	id: id(),
	title: text().notNull(),
	titleBn: text('title_bn'),
	slug: text().notNull().unique(),
	description: text(),
	image: text(),
	/** What the set costs. The saving is this against the sum of its parts. */
	price: poisha('price').notNull(),
	active: boolean().notNull().default(true),
	sort: integer().notNull().default(0),
	createdAt: now()
});

export const bundleItems = pgTable(
	'bundle_items',
	{
		id: id(),
		bundleId: uuid('bundle_id')
			.notNull()
			.references(() => bundles.id, { onDelete: 'cascade' }),
		productId: uuid('product_id')
			.notNull()
			.references(() => products.id, { onDelete: 'cascade' }),
		variantId: uuid('variant_id').references(() => variants.id, { onDelete: 'set null' }),
		qty: integer().notNull().default(1)
	},
	(t) => [index('bundle_items_bundle_idx').on(t.bundleId)]
);

/* ── cart & wishlist ─────────────────────────────────────────────────── */
export const carts = pgTable(
	'carts',
	{
		id: id(),
		token: text().notNull().unique(), // cookie value for guests
		customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'cascade' }),
		/** Captured at checkout as soon as the shopper types a valid number, which
		    is what makes an abandoned cart recoverable at all. */
		phone: text(),
		name: text(),
		/** Set when a recovery message goes out, so nobody is pestered twice. */
		remindedAt: timestamp('reminded_at', { withTimezone: true }),
		updatedAt: now()
	},
	(t) => [index('carts_customer_idx').on(t.customerId)]
);

export const cartItems = pgTable(
	'cart_items',
	{
		id: id(),
		cartId: uuid('cart_id')
			.notNull()
			.references(() => carts.id, { onDelete: 'cascade' }),
		productId: uuid('product_id')
			.notNull()
			.references(() => products.id, { onDelete: 'cascade' }),
		variantId: uuid('variant_id').references(() => variants.id, { onDelete: 'cascade' }),
		bundleId: uuid('bundle_id').references(() => bundles.id, { onDelete: 'set null' }),
		/** Set for bundle lines: the share of the bundle price this line carries. */
		unitPrice: poisha('unit_price'),
		qty: integer().notNull().default(1)
	},
	(t) => [uniqueIndex('cart_items_unique').on(t.cartId, t.productId, t.variantId)]
);

export const wishlist = pgTable(
	'wishlist',
	{
		customerId: uuid('customer_id')
			.notNull()
			.references(() => customers.id, { onDelete: 'cascade' }),
		productId: uuid('product_id')
			.notNull()
			.references(() => products.id, { onDelete: 'cascade' }),
		createdAt: now()
	},
	(t) => [primaryKey({ columns: [t.customerId, t.productId] })]
);

/**
 * Bangladeshi delivery geography: districts with areas (thana/upazila) beneath.
 * Self-referencing like categories. The zone lives here rather than being picked
 * by the shopper, so the delivery charge cannot be gamed at checkout.
 */
export const regions = pgTable(
	'regions',
	{
		id: id(),
		parentId: uuid('parent_id'),
		name: text().notNull(),
		nameBn: text('name_bn'),
		zone: deliveryZone().notNull().default('outside_dhaka'),
		sort: integer().notNull().default(0),
		active: boolean().notNull().default(true)
	},
	(t) => [
		index('regions_parent_idx').on(t.parentId, t.sort, t.name),
		// Two partial indexes rather than one: a plain unique index ignores rows
		// where parent_id IS NULL, so districts would not collide and re-running
		// the seed would duplicate all 64 of them.
		uniqueIndex('regions_area_unique')
			.on(t.parentId, t.name)
			.where(sql`parent_id is not null`),
		uniqueIndex('regions_district_unique')
			.on(t.name)
			.where(sql`parent_id is null`)
	]
);

/* ── addresses & orders ──────────────────────────────────────────────── */
export const addresses = pgTable('addresses', {
	id: id(),
	customerId: uuid('customer_id')
		.notNull()
		.references(() => customers.id, { onDelete: 'cascade' }),
	name: text().notNull(),
	phone: text().notNull(),
	zone: deliveryZone().notNull(),
	districtId: uuid('district_id').references(() => regions.id, { onDelete: 'set null' }),
	areaId: uuid('area_id').references(() => regions.id, { onDelete: 'set null' }),
	city: text().notNull(),
	area: text(),
	line: text().notNull(),
	isDefault: boolean('is_default').notNull().default(false)
});

export const orders = pgTable(
	'orders',
	{
		id: id(),
		number: text().notNull().unique(), // human-facing, e.g. 250907-0041
		customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'set null' }),
		name: text().notNull(),
		phone: text().notNull(),
		address: jsonb().$type<{ zone: string; city: string; area?: string; line: string }>().notNull(),
		zone: deliveryZone().notNull(),
		subtotal: poisha('subtotal').notNull(),
		discount: poisha('discount').notNull().default(0),
		shipping: poisha('shipping').notNull().default(0),
		total: poisha('total').notNull(),
		couponCode: text('coupon_code'),
		paymentMethod: paymentMethod('payment_method').notNull(),
		paymentStatus: paymentStatus('payment_status').notNull().default('unpaid'),
		status: orderStatus().notNull().default('pending'),
		courier: text(),
		consignmentId: text('consignment_id'),
		trackingCode: text('tracking_code'),
		/** The courier's own wording, kept verbatim beside our pipeline status. */
		courierStatus: text('courier_status'),
		courierSyncedAt: timestamp('courier_synced_at', { withTimezone: true }),
		note: text(),
		createdAt: now()
	},
	(t) => [
		index('orders_status_idx').on(t.status, t.createdAt),
		index('orders_phone_idx').on(t.phone)
	]
);

export const orderItems = pgTable(
	'order_items',
	{
		id: id(),
		orderId: uuid('order_id')
			.notNull()
			.references(() => orders.id, { onDelete: 'cascade' }),
		productId: uuid('product_id').references(() => products.id, { onDelete: 'set null' }),
		variantId: uuid('variant_id').references(() => variants.id, { onDelete: 'set null' }),
		title: text().notNull(), // snapshot — products get renamed
		optionLabel: text('option_label'),
		image: text(),
		unitPrice: poisha('unit_price').notNull(),
		qty: integer().notNull()
	},
	(t) => [index('order_items_order_idx').on(t.orderId)]
);

export const orderEvents = pgTable(
	'order_events',
	{
		id: serial().primaryKey(),
		orderId: uuid('order_id')
			.notNull()
			.references(() => orders.id, { onDelete: 'cascade' }),
		fromStatus: orderStatus('from_status'),
		toStatus: orderStatus('to_status').notNull(),
		note: text(),
		actorId: uuid('actor_id').references(() => adminUsers.id, { onDelete: 'set null' }),
		createdAt: now()
	},
	(t) => [index('order_events_order_idx').on(t.orderId, t.createdAt)]
);

/* ── promotions ──────────────────────────────────────────────────────── */
export const coupons = pgTable('coupons', {
	id: id(),
	code: text().notNull().unique(),
	type: couponType().notNull(),
	value: integer().notNull(), // percent (0–100) or poisha, by type
	minOrder: poisha('min_order').notNull().default(0),
	usageLimit: integer('usage_limit'),
	perCustomerLimit: integer('per_customer_limit').notNull().default(1),
	usedCount: integer('used_count').notNull().default(0),
	startsAt: timestamp('starts_at', { withTimezone: true }),
	endsAt: timestamp('ends_at', { withTimezone: true }),
	active: boolean().notNull().default(true)
});

/* ── unified inbox ───────────────────────────────────────────────────── */

export const channel = pgEnum('channel', [
	'site',
	'messenger',
	'instagram',
	'whatsapp',
	'telegram',
	'sms'
]);
export const conversationStatus = pgEnum('conversation_status', ['open', 'snoozed', 'closed']);
export const messageAuthor = pgEnum('message_author', ['customer', 'staff', 'ai']);

/**
 * One thread per person per channel. `externalId` is the platform's own thread
 * id (page-scoped sender id, chat id, phone number) — unique per channel so an
 * inbound webhook can find its thread without a lookup table.
 */
export const conversations = pgTable(
	'conversations',
	{
		id: id(),
		channel: channel().notNull(),
		externalId: text('external_id'),
		customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'set null' }),
		orderId: uuid('order_id').references(() => orders.id, { onDelete: 'set null' }),
		/** What the customer was looking at when they wrote — the missing context
		    that otherwise leaves staff answering "which one?" */
		productId: uuid('product_id').references(() => products.id, { onDelete: 'set null' }),
		sourceUrl: text('source_url'),
		name: text().notNull(),
		phone: text(),
		status: conversationStatus().notNull().default('open'),
		assignedTo: uuid('assigned_to').references(() => adminUsers.id, { onDelete: 'set null' }),
		unread: boolean().notNull().default(true),
		lastMessageAt: now(),
		createdAt: now()
	},
	(t) => [
		index('conversations_status_idx').on(t.status, t.lastMessageAt),
		uniqueIndex('conversations_external_unique')
			.on(t.channel, t.externalId)
			.where(sql`external_id is not null`)
	]
);

export const messages = pgTable(
	'messages',
	{
		id: id(),
		conversationId: uuid('conversation_id')
			.notNull()
			.references(() => conversations.id, { onDelete: 'cascade' }),
		inbound: boolean().notNull(), // from the customer, rather than to them
		author: messageAuthor().notNull(),
		authorName: text('author_name'),
		body: text().notNull(),
		attachments: jsonb().$type<{ url: string; type: string }[]>().notNull().default([]),
		externalId: text('external_id'),
		/** Drafted by the assistant and sent by a human — the suggest-mode audit trail. */
		fromSuggestion: boolean('from_suggestion').notNull().default(false),
		createdAt: now()
	},
	(t) => [index('messages_conversation_idx').on(t.conversationId, t.createdAt)]
);

/* ── CMS ─────────────────────────────────────────────────────────────── */
export type Block = { id: string; type: string; props: Record<string, unknown> };

export const pages = pgTable('pages', {
	id: id(),
	slug: text().notNull().unique(), // 'home' for the homepage
	title: text().notNull(),
	blocks: jsonb().$type<Block[]>().notNull().default([]),
	draftBlocks: jsonb('draft_blocks').$type<Block[]>(), // preview before publish
	seoTitle: text('seo_title'),
	seoDescription: text('seo_description'),
	published: boolean().notNull().default(false),
	updatedAt: now()
});

export type MenuNode = { label: string; labelBn?: string; href: string; children?: MenuNode[] };

export const menus = pgTable('menus', {
	key: text().primaryKey(), // 'header' | 'footer' | 'mobile'
	tree: jsonb().$type<MenuNode[]>().notNull().default([])
});

/** Branding, contact, socials, delivery charges, auth.otp_enabled, … */
export const settings = pgTable('settings', {
	key: text().primaryKey(),
	value: jsonb().notNull()
});

/* ── relations ───────────────────────────────────────────────────────── */
export const productRelations = relations(products, ({ many }) => ({
	images: many(productImages),
	variants: many(variants),
	options: many(productOptions),
	categories: many(productCategories)
}));

export const categoryRelations = relations(categories, ({ one, many }) => ({
	parent: one(categories, { fields: [categories.parentId], references: [categories.id] }),
	children: many(categories)
}));

export const orderRelations = relations(orders, ({ many }) => ({
	items: many(orderItems),
	events: many(orderEvents)
}));

export const cartRelations = relations(carts, ({ many }) => ({ items: many(cartItems) }));
