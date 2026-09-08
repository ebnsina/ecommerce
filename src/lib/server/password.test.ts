import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from './password';

describe('password hashing', () => {
	it('verifies the right password and rejects the wrong one', async () => {
		const hash = await hashPassword('correct horse battery');
		expect(await verifyPassword('correct horse battery', hash)).toBe(true);
		expect(await verifyPassword('correct horse batterx', hash)).toBe(false);
	});

	it('salts — the same password hashes differently every time', async () => {
		expect(await hashPassword('same')).not.toBe(await hashPassword('same'));
	});

	it('rejects malformed or foreign hashes instead of throwing', async () => {
		expect(await verifyPassword('x', 'not-a-hash')).toBe(false);
		expect(await verifyPassword('x', '$2b$10$abc')).toBe(false);
	});
});
