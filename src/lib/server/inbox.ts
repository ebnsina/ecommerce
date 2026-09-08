/** Inbox service: find-or-create threads, record messages, send replies. */
import { and, desc, eq, sql, count } from 'drizzle-orm';
import { db } from './db';
import { conversations, messages, customers, orders, products } from './db/schema';
import { adapters, type ChannelKey } from './channels';
import { normalizePhone } from '$lib/phone';
import { contextFor } from './messageContext';

/**
 * Finds the thread for a platform sender, creating it on first contact.
 * Keyed on (channel, externalId) so a webhook never needs a lookup table.
 */
export async function findOrCreateConversation(input: {
	channel: ChannelKey;
	externalId: string | null;
	name: string;
	phone?: string | null;
}) {
	const phone = input.phone ? normalizePhone(input.phone) : null;

	if (input.externalId) {
		const [existing] = await db
			.select()
			.from(conversations)
			.where(
				and(
					eq(conversations.channel, input.channel),
					eq(conversations.externalId, input.externalId)
				)
			)
			.limit(1);
		if (existing) return existing;
	}

	// Link to a customer account when the phone number matches one.
	const customerId = phone
		? ((
				await db
					.select({ id: customers.id })
					.from(customers)
					.where(eq(customers.phone, phone))
					.limit(1)
			)[0]?.id ?? null)
		: null;

	const [created] = await db
		.insert(conversations)
		.values({
			channel: input.channel,
			externalId: input.externalId,
			name: input.name || 'Guest',
			phone,
			customerId
		})
		.returning();
	return created;
}

export async function recordMessage(input: {
	conversationId: string;
	inbound: boolean;
	author: 'customer' | 'staff' | 'ai';
	authorName?: string | null;
	body: string;
	externalId?: string | null;
	fromSuggestion?: boolean;
}) {
	const [row] = await db
		.insert(messages)
		.values({
			conversationId: input.conversationId,
			inbound: input.inbound,
			author: input.author,
			authorName: input.authorName ?? null,
			body: input.body,
			externalId: input.externalId ?? null,
			fromSuggestion: input.fromSuggestion ?? false
		})
		.returning();

	await db
		.update(conversations)
		.set({
			lastMessageAt: new Date(),
			// An inbound message reopens a closed thread — a customer replying to
			// something you marked done is not done.
			unread: input.inbound ? true : false,
			...(input.inbound ? { status: 'open' as const } : {})
		})
		.where(eq(conversations.id, input.conversationId));

	return row;
}

/** Records the customer's message and returns the thread it landed in. */
export async function receiveMessage(input: {
	channel: ChannelKey;
	externalId: string | null;
	name: string;
	phone?: string | null;
	body: string;
	messageId?: string | null;
	/** Referral payload from the platform, e.g. m.me/<page>?ref=<slug> */
	ref?: string | null;
	/** Page the website widget was opened from. */
	sourceUrl?: string | null;
}) {
	const conversation = await findOrCreateConversation(input);

	// Attach what the message is about the first time we can work it out, so a
	// thread that opens with "koto taka?" still says which product.
	if (!conversation.productId) {
		const product = await contextFor(input);
		if (product || input.sourceUrl)
			await db
				.update(conversations)
				.set({
					productId: product?.id ?? conversation.productId,
					sourceUrl: input.sourceUrl ?? conversation.sourceUrl
				})
				.where(eq(conversations.id, conversation.id));
	}
	await recordMessage({
		conversationId: conversation.id,
		inbound: true,
		author: 'customer',
		authorName: conversation.name,
		body: input.body,
		externalId: input.messageId
	});

	/* The assistant may answer this, if the owner has switched it on and the
	   question is one the shop's own settings answer. It decides for itself and
	   stays quiet by default; a failure here must never lose the message that
	   has just been recorded. */
	try {
		const { considerAutoReply } = await import('./autoReply');
		await considerAutoReply(conversation.id, input.body);
	} catch (e) {
		console.error('[inbox] auto-reply failed', e);
	}

	return conversation;
}

/** Sends through the thread's own channel, then records what was sent. */
export async function replyToConversation(
	conversationId: string,
	text: string,
	staffName: string,
	fromSuggestion = false
) {
	const [conversation] = await db
		.select()
		.from(conversations)
		.where(eq(conversations.id, conversationId))
		.limit(1);
	if (!conversation) throw new Error('Conversation not found.');

	const adapter = adapters[conversation.channel as ChannelKey];
	const { externalId } = await adapter.send(
		{ externalId: conversation.externalId, phone: conversation.phone },
		text
	);

	return recordMessage({
		conversationId,
		inbound: false,
		author: 'staff',
		authorName: staffName,
		body: text,
		externalId,
		fromSuggestion
	});
}

export async function getThread(conversationId: string) {
	const [conversation] = await db
		.select()
		.from(conversations)
		.where(eq(conversations.id, conversationId))
		.limit(1);
	if (!conversation) return null;

	const rows = await db
		.select()
		.from(messages)
		.where(eq(messages.conversationId, conversationId))
		.orderBy(messages.createdAt);

	const [product] = conversation.productId
		? await db
				.select({
					id: products.id,
					title: products.title,
					slug: products.slug,
					price: products.price,
					stock: products.stock,
					hasVariants: products.hasVariants,
					image: sql<string | null>`(select pi.url from product_images pi
						where pi.product_id = products.id order by pi.sort limit 1)`
				})
				.from(products)
				.where(eq(products.id, conversation.productId))
				.limit(1)
		: [];

	const recentOrders = conversation.phone
		? await db
				.select({
					id: orders.id,
					number: orders.number,
					status: orders.status,
					total: orders.total,
					createdAt: orders.createdAt
				})
				.from(orders)
				.where(eq(orders.phone, conversation.phone))
				.orderBy(desc(orders.createdAt))
				.limit(5)
		: [];

	return { conversation, messages: rows, orders: recentOrders, product: product ?? null };
}

export const unreadCount = async () =>
	(
		await db
			.select({ n: count() })
			.from(conversations)
			.where(and(eq(conversations.unread, true), eq(conversations.status, 'open')))
	)[0]?.n ?? 0;
