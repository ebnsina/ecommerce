/**
 * Password hashing — node:crypto scrypt. No argon2/bcrypt dependency.
 * Kept db-free so scripts (seed, CLI) can import it outside Vite.
 */
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;

export async function hashPassword(password: string): Promise<string> {
	const salt = randomBytes(16);
	const key = await scryptAsync(password.normalize('NFKC'), salt, 64);
	return `scrypt$${salt.toString('hex')}$${key.toString('hex')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
	const [scheme, saltHex, keyHex] = stored.split('$');
	if (scheme !== 'scrypt' || !saltHex || !keyHex) return false;
	const key = await scryptAsync(password.normalize('NFKC'), Buffer.from(saltHex, 'hex'), 64);
	const expected = Buffer.from(keyHex, 'hex');
	return key.length === expected.length && timingSafeEqual(key, expected);
}
