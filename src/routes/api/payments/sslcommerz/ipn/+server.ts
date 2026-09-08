/**
 * SSLCommerz's server-to-server notice. It is the reliable half of the flow:
 * a shopper who closes the tab after paying never hits the redirect, but this
 * still arrives.
 *
 * The body is not trusted — anyone can post here. It only tells us which
 * transaction to go and ask the gateway about.
 */
import { json } from '@sveltejs/kit';
import { settleOrder } from '$lib/server/payments';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const form = await request.formData();
	const valId = String(form.get('val_id') ?? '');
	const tranId = String(form.get('tran_id') ?? '');

	if (!valId || !tranId)
		return json({ ok: false, error: 'Missing val_id or tran_id' }, { status: 400 });

	const result = await settleOrder(valId, tranId);
	// Always 200: a non-2xx makes the gateway retry, and a genuine mismatch is
	// not something a retry will fix.
	if (!result.ok) console.error('[sslcommerz] ipn rejected', tranId, result.error);
	return json({ ok: result.ok });
};
