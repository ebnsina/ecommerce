/**
 * What a staff member may reach.
 *
 * `admin_users.role` was stored and shown in the sidebar but never checked, so
 * every account was effectively an owner. These two sections are the ones worth
 * separating: Settings decides what the shop charges and how it signs people
 * in, and Integrations holds the credentials for the couriers, the gateway and
 * the messaging channels — a staff account with those can move money and read
 * every conversation.
 *
 * Everything else is the daily work of running the shop and stays open to all
 * three roles. Enforced in hooks.server.ts, so form actions are covered too.
 */
export const OWNER_ONLY = ['/admin/settings', '/admin/integrations'] as const;

export type AdminRole = 'owner' | 'manager' | 'staff';

export const ownerOnly = (pathname: string) =>
	OWNER_ONLY.some((p) => pathname === p || pathname.startsWith(`${p}/`));

export const mayVisit = (pathname: string, role: AdminRole) =>
	role === 'owner' || !ownerOnly(pathname);
