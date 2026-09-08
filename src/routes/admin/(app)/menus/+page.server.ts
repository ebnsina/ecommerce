import { asc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { menus, categories, pages } from '$lib/server/db/schema';
import type { MenuNode } from '$lib/server/db/schema';
import type { Actions, PageServerLoad } from './$types';
import { shop } from '$lib/paths';

export const load: PageServerLoad = async () => {
	const [rows, cats, pageRows] = await Promise.all([
		db.select().from(menus),
		db
			.select({ name: categories.name, slug: categories.slug, parentId: categories.parentId })
			.from(categories)
			.orderBy(asc(categories.sort), asc(categories.name)),
		db.select({ title: pages.title, slug: pages.slug }).from(pages).where(eq(pages.published, true))
	]);

	const tree = Object.fromEntries(rows.map((r) => [r.key, r.tree]));

	return {
		header: (tree.header ?? []) as MenuNode[],
		footer: (tree.footer ?? []) as MenuNode[],
		/** What the link picker offers instead of making staff type URLs. */
		targets: [
			{
				group: 'Pages',
				items: [
					{ label: 'Home', href: '/' },
					...pageRows
						.filter((p) => p.slug !== 'home')
						.map((p) => ({ label: p.title, href: shop(`/pages/${p.slug}`) }))
				]
			},
			{
				group: 'Categories',
				items: cats.map((c) => ({
					label: c.parentId ? `— ${c.name}` : c.name,
					href: shop(`/c/${c.slug}`)
				}))
			},
			{
				group: 'Shop',
				items: [
					{ label: 'All products', href: shop('/search') },
					{ label: 'My account', href: shop('/account') },
					{ label: 'Track my order', href: shop('/account/orders') },
					{ label: 'Wishlist', href: shop('/account/wishlist') }
				]
			}
		]
	};
};

/** Keeps only well-formed nodes, two levels deep — the header renders no more. */
function clean(raw: unknown, depth = 0): MenuNode[] {
	if (!Array.isArray(raw)) return [];
	return raw
		.filter((n) => n && typeof n.label === 'string' && n.label.trim())
		.map((n) => ({
			label: String(n.label).trim(),
			labelBn: n.labelBn ? String(n.labelBn).trim() : undefined,
			href: String(n.href ?? '').trim(),
			children: depth < 1 ? clean(n.children, depth + 1) : undefined
		}));
}

export const actions: Actions = {
	save: async ({ request }) => {
		const form = await request.formData();
		const key = String(form.get('key') ?? '');
		if (key !== 'header' && key !== 'footer') return { ok: false };

		const tree = clean(JSON.parse(String(form.get('tree') ?? '[]')));
		await db
			.insert(menus)
			.values({ key, tree })
			.onConflictDoUpdate({ target: menus.key, set: { tree } });

		return { saved: key };
	}
};
