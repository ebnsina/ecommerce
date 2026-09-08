import { fail } from '@sveltejs/kit';
import { and, eq, sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { addresses } from '$lib/server/db/schema';
import { normalizePhone } from '$lib/phone';
import { getSettings } from '$lib/server/settings';
import { getRegions } from '$lib/server/regions';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const [{ delivery }, regions] = await Promise.all([getSettings(), getRegions()]);
	return {
		list: await db
			.select()
			.from(addresses)
			.where(eq(addresses.customerId, locals.user!.id))
			.orderBy(sql`${addresses.isDefault} desc`),
		regions,
		zones: Object.entries(delivery).map(([value, z]) => ({ value, label: z.label }))
	};
};

export const actions: Actions = {
	save: async ({ request, locals }) => {
		const form = await request.formData();
		const customerId = locals.user!.id;
		const id = String(form.get('id') ?? '');
		const phone = normalizePhone(String(form.get('phone') ?? ''));

		if (!phone) return fail(400, { error: 'Enter a valid Bangladeshi mobile number.' });
		const values = {
			customerId,
			name: String(form.get('name') ?? '').trim(),
			phone,
			zone: String(form.get('zone') ?? 'inside_dhaka') as
				'inside_dhaka' | 'suburban_dhaka' | 'outside_dhaka',
			city: String(form.get('city') ?? '').trim(),
			area: String(form.get('area') ?? '').trim() || null,
			line: String(form.get('line') ?? '').trim(),
			isDefault: form.get('isDefault') === 'on'
		};
		if (!values.name || !values.city || !values.line)
			return fail(400, { error: 'Name, city and full address are required.' });

		await db.transaction(async (tx) => {
			if (values.isDefault)
				await tx
					.update(addresses)
					.set({ isDefault: false })
					.where(eq(addresses.customerId, customerId));

			if (id) {
				await tx
					.update(addresses)
					.set(values)
					.where(and(eq(addresses.id, id), eq(addresses.customerId, customerId)));
			} else {
				const [{ n }] = await tx
					.select({ n: sql<number>`count(*)::int` })
					.from(addresses)
					.where(eq(addresses.customerId, customerId));
				await tx.insert(addresses).values({ ...values, isDefault: values.isDefault || n === 0 });
			}
		});
		return { ok: true };
	},

	remove: async ({ request, locals }) => {
		const id = String((await request.formData()).get('id') ?? '');
		await db
			.delete(addresses)
			.where(and(eq(addresses.id, id), eq(addresses.customerId, locals.user!.id)));
		return { ok: true };
	},

	makeDefault: async ({ request, locals }) => {
		const id = String((await request.formData()).get('id') ?? '');
		const customerId = locals.user!.id;
		await db.transaction(async (tx) => {
			await tx
				.update(addresses)
				.set({ isDefault: false })
				.where(eq(addresses.customerId, customerId));
			await tx
				.update(addresses)
				.set({ isDefault: true })
				.where(and(eq(addresses.id, id), eq(addresses.customerId, customerId)));
		});
		return { ok: true };
	}
};
