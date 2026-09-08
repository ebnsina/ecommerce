/**
 * Browser-side Meta Pixel events. A no-op when no pixel is configured, so
 * callers never have to check.
 */
export function track(name: string, params?: Record<string, unknown>, eventId?: string) {
	if (typeof window === 'undefined') return;
	(window as any).fbq?.('track', name, params ?? {}, eventId ? { eventID: eventId } : undefined);
}
