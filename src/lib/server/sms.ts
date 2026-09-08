/**
 * SMS gateway. One function, one provider — swap the fetch when the account
 * is live (Alpha SMS / SSL Wireless both take a GET or a JSON POST).
 * Without credentials it logs to the server console so OTP works in dev.
 */
import { env } from '$env/dynamic/private';
import { toInternational } from '$lib/phone';

export async function sendSms(phone: string, message: string): Promise<boolean> {
	const to = toInternational(phone);

	if (!env.SMS_API_KEY || !env.SMS_API_URL) {
		console.info(`[sms] ${to}: ${message}`);
		return true;
	}

	try {
		const res = await fetch(env.SMS_API_URL, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({
				api_key: env.SMS_API_KEY,
				senderid: env.SMS_SENDER_ID,
				msg: message,
				contacts: to
			})
		});
		if (!res.ok) console.error(`[sms] gateway ${res.status} for ${to}`);
		return res.ok;
	} catch (e) {
		console.error('[sms] failed', e);
		return false;
	}
}
