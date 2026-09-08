import {
	topSearches,
	unmetDemand,
	interestVsSales,
	bestSellers,
	fulfilmentRates
} from '$lib/server/intent';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	// One window for the whole page, so every figure covers the same period.
	const allowed = [7, 30, 90];
	const asked = Number(url.searchParams.get('days') ?? 30);
	const days = allowed.includes(asked) ? asked : 30;

	const [searches, unmet, interest, sellers, rates] = await Promise.all([
		topSearches(days),
		unmetDemand(days),
		interestVsSales(days),
		bestSellers(days),
		fulfilmentRates(days)
	]);

	return { days, searches, unmet, interest, sellers, rates };
};
