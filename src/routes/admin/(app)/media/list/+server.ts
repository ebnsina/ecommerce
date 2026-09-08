import { json } from '@sveltejs/kit';
import { desc } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { media } from '$lib/server/db/schema';
import type { RequestHandler } from './$types';

/** Feeds the media picker. Guarded by the /admin layout's session check. */
export const GET: RequestHandler = async () =>
	json(
		await db
			.select({ id: media.id, url: media.url, alt: media.alt })
			.from(media)
			.orderBy(desc(media.createdAt))
			.limit(200)
	);
