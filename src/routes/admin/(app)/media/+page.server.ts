import { fail } from '@sveltejs/kit';
import { count, desc, eq, ilike, or } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { media } from '$lib/server/db/schema';
import { saveUpload, deleteUpload } from '$lib/server/storage';
import { listParams } from '$lib/admin/listQuery';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const { q, page, perPage } = listParams(url);
	// A gallery wants more per screen than a table row does.
	const size = perPage === 10 ? 24 : perPage;

	const where = q ? or(ilike(media.url, `%${q}%`), ilike(media.alt, `%${q}%`)) : undefined;

	const [items, [{ n: total }]] = await Promise.all([
		db
			.select()
			.from(media)
			.where(where)
			.orderBy(desc(media.createdAt))
			.limit(size)
			.offset((page - 1) * size),
		db.select({ n: count() }).from(media).where(where)
	]);

	return { items, total, page, perPage: size, filters: { q } };
};

export const actions: Actions = {
	upload: async ({ request }) => {
		const form = await request.formData();
		const files = form.getAll('files').filter((f): f is File => f instanceof File && f.size > 0);
		if (!files.length) return fail(400, { error: 'Choose at least one image.' });

		const saved = [];
		for (const file of files) {
			try {
				const { url, size } = await saveUpload(file);
				saved.push({ url, alt: file.name.replace(/\.[^.]+$/, ''), sizeBytes: size });
			} catch (e) {
				return fail(400, { error: (e as Error).message });
			}
		}
		await db.insert(media).values(saved);
		return { ok: true, count: saved.length };
	},

	remove: async ({ request }) => {
		const id = String((await request.formData()).get('id') ?? '');
		const [row] = await db.select().from(media).where(eq(media.id, id)).limit(1);
		if (!row) return fail(404, { error: 'Not found.' });

		await deleteUpload(row.url);
		await db.delete(media).where(eq(media.id, id));
		return { ok: true };
	},

	rename: async ({ request }) => {
		const form = await request.formData();
		await db
			.update(media)
			.set({ alt: String(form.get('alt') ?? '').trim() || null })
			.where(eq(media.id, String(form.get('id') ?? '')));
		return { ok: true };
	}
};
