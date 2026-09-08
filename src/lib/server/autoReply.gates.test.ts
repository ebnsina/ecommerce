import { describe, it, expect, vi, beforeEach } from 'vitest';

/* Each gate is a reason a customer does not hear from a machine. A regression
   in any one of them is a public mistake, so they are pinned individually. */

const state = {
	settings: { autoReply: { enabled: true, channels: ['site'], confidence: 85 } },
	conversation: {
		id: 'c1',
		channel: 'site',
		externalId: 'x1',
		phone: null,
		assignedTo: null as string | null
	},
	aiMessages: 0,
	verdict: { intent: 'delivery_charge', confidence: 95, reply: 'Inside Dhaka it is ৳60.' } as any,
	sent: [] as string[]
};

vi.mock('$env/dynamic/private', () => ({ env: {} }));
vi.mock('./settings', () => ({ getSettings: async () => state.settings }));
vi.mock('./ai', () => ({
	isAiConfigured: () => true,
	storeContext: async () => 'Delivery inside Dhaka: ৳60',
	generateJson: async () => state.verdict
}));
vi.mock('./channels', () => ({
	adapters: {
		site: {
			configured: () => true,
			send: async (_to: unknown, text: string) => {
				state.sent.push(text);
				return {};
			}
		}
	}
}));
/* A chainable stub: the module calls .from().where().limit() for the
   conversation and .from().where() for the count, so where() has to be both
   awaitable and further chainable. */
vi.mock('./db', () => {
	const rowsFor = (cols: any) =>
		cols?.n !== undefined ? [{ n: state.aiMessages }] : [state.conversation];

	const where = (cols: any) => {
		const result: any = Promise.resolve(rowsFor(cols));
		result.limit = async () => rowsFor(cols);
		return result;
	};

	return {
		db: {
			select: (cols?: any) => ({ from: () => ({ where: () => where(cols) }) }),
			insert: () => ({ values: async () => {} }),
			update: () => ({ set: () => ({ where: async () => {} }) })
		}
	};
});

vi.mock('./db/schema', () => ({ conversations: 'conversations', messages: 'messages' }));

const { considerAutoReply } = await import('./autoReply');

beforeEach(() => {
	state.settings = { autoReply: { enabled: true, channels: ['site'], confidence: 85 } };
	state.conversation = {
		id: 'c1',
		channel: 'site',
		externalId: 'x1',
		phone: null,
		assignedTo: null
	};
	state.aiMessages = 0;
	state.verdict = { intent: 'delivery_charge', confidence: 95, reply: 'Inside Dhaka it is ৳60.' };
	state.sent = [];
});

describe('considerAutoReply gates', () => {
	it('answers a simple question it is confident about', async () => {
		const r = await considerAutoReply('c1', 'Dhaka te charge koto?');
		expect(r.sent).toBe(true);
		expect(state.sent).toEqual(['Inside Dhaka it is ৳60.']);
	});

	it('stays quiet when the owner has not switched it on', async () => {
		state.settings.autoReply.enabled = false;
		expect((await considerAutoReply('c1', 'hi')).sent).toBe(false);
		expect(state.sent).toEqual([]);
	});

	it('stays quiet on a channel it was not switched on for', async () => {
		state.settings.autoReply.channels = ['telegram'];
		expect((await considerAutoReply('c1', 'hi')).sent).toBe(false);
	});

	it('never answers a thread a colleague has picked up', async () => {
		state.conversation.assignedTo = 'staff-1';
		const r = await considerAutoReply('c1', 'hi');
		expect(r.sent).toBe(false);
		expect(r.reason).toMatch(/colleague/i);
	});

	it('never replies twice to the same thread', async () => {
		state.aiMessages = 1;
		expect((await considerAutoReply('c1', 'and delivery time?')).sent).toBe(false);
	});

	// The important one: confidence must never override the allowlist.
	it('refuses anything outside the allowlist however sure it claims to be', async () => {
		state.verdict = { intent: 'refund', confidence: 100, reply: 'Refunding you now.' };
		const r = await considerAutoReply('c1', 'I want my money back');
		expect(r.sent).toBe(false);
		expect(state.sent).toEqual([]);
	});

	it('refuses a safe intent it is not confident enough about', async () => {
		state.verdict = { intent: 'delivery_charge', confidence: 60, reply: 'Maybe ৳60?' };
		expect((await considerAutoReply('c1', 'charge?')).sent).toBe(false);
	});

	it('sends nothing when the model returns an empty reply', async () => {
		state.verdict = { intent: 'greeting', confidence: 99, reply: '   ' };
		expect((await considerAutoReply('c1', 'hello')).sent).toBe(false);
	});
});
