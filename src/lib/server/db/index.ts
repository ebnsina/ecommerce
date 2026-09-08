import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { env } from '$env/dynamic/private';

/**
 * The database handle, connected on first use rather than on import.
 *
 * Throwing at import time meant the app could not be built without a reachable
 * DATABASE_URL: SvelteKit's build analyses every server module, so a container
 * image or a CI run had to be handed a production secret it never uses. The
 * error still arrives — just at the first query, where it belongs.
 */
let instance: ReturnType<typeof drizzle<typeof schema>> | null = null;

function connect() {
	if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
	return drizzle(postgres(env.DATABASE_URL), { schema, casing: 'snake_case' });
}

export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
	get(_target, prop, receiver) {
		instance ??= connect();
		return Reflect.get(instance, prop, receiver);
	}
});
