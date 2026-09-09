/** Admin navigation — one source of truth for the sidebar AND the breadcrumb labels. */
import {
	LayoutDashboard,
	ChartNoAxesCombined,
	Package,
	PackagePlus,
	FolderTree,
	Images,
	ShoppingCart,
	ShoppingBasket,
	TicketPercent,
	Users,
	UserPlus,
	MessageSquare,
	MessageCircleQuestion,
	Inbox as InboxIcon,
	FileText,
	Newspaper,
	Menu as MenuIcon,
	Settings,
	SearchCode,
	Plug,
	type Icon
} from '@lucide/svelte';

export type NavItem = { href: string; label: string; icon?: typeof Icon };
export type NavGroup = { title: string; items: NavItem[] };

export const navGroups: NavGroup[] = [
	{
		title: 'Overview',
		items: [
			{ href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
			{ href: '/admin/insights', icon: ChartNoAxesCombined, label: 'Insights' }
		]
	},
	{
		title: 'Catalog',
		items: [
			{ href: '/admin/products', icon: Package, label: 'Products' },
			{ href: '/admin/bundles', icon: PackagePlus, label: 'Bundles' },
			{ href: '/admin/categories', icon: FolderTree, label: 'Categories' },
			{ href: '/admin/media', icon: Images, label: 'Media' }
		]
	},
	{
		title: 'Sales',
		items: [
			{ href: '/admin/inbox', icon: InboxIcon, label: 'Inbox' },
			{ href: '/admin/orders', icon: ShoppingCart, label: 'Orders' },
			{ href: '/admin/abandoned', icon: ShoppingBasket, label: 'Abandoned carts' },
			{ href: '/admin/coupons', icon: TicketPercent, label: 'Coupons' },
			{ href: '/admin/customers', icon: Users, label: 'Customers' },
			{ href: '/admin/reviews', icon: MessageSquare, label: 'Reviews' },
			{ href: '/admin/questions', icon: MessageCircleQuestion, label: 'Questions' },
			{ href: '/admin/leads', icon: UserPlus, label: 'Leads' }
		]
	},
	{
		title: 'Storefront',
		items: [
			{ href: '/admin/pages', icon: FileText, label: 'Pages' },
			{ href: '/admin/posts', icon: Newspaper, label: 'Blog' },
			{ href: '/admin/menus', icon: MenuIcon, label: 'Menus' }
		]
	},
	{
		title: 'System',
		items: [
			{ href: '/admin/search', icon: SearchCode, label: 'Search' },
			{ href: '/admin/settings', icon: Settings, label: 'Settings' },
			{ href: '/admin/integrations', icon: Plug, label: 'Integrations' }
		]
	}
];

const labels = new Map(navGroups.flatMap((g) => g.items.map((i) => [i.href, i.label] as const)));

const titleCase = (seg: string) => seg.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

/** '/admin/products/new' -> Dashboard / Products / New */
export function breadcrumbs(pathname: string): NavItem[] {
	const segments = pathname.split('/').filter(Boolean); // ['admin', 'products', …]
	const crumbs: NavItem[] = [{ href: '/admin', icon: LayoutDashboard, label: 'Dashboard' }];

	let href = '/admin';
	for (const seg of segments.slice(1)) {
		href += `/${seg}`;
		// A uuid segment is a record, not a section — the page overrides that label.
		const isId = /^[0-9a-f-]{20,}$/i.test(seg);
		crumbs.push({ href, label: labels.get(href) ?? (isId ? 'Details' : titleCase(seg)) });
	}
	return crumbs;
}
