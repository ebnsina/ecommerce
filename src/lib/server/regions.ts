/**
 * Delivery geography. Districts are the 64 official ones; areas are the
 * thana/upazila beneath them. The zone is a property of the place, not a
 * shopper choice, so the delivery charge follows automatically.
 */
import { asc, eq, isNull, and } from 'drizzle-orm';
import { db } from './db';
import { regions } from './db/schema';

export type Zone = 'inside_dhaka' | 'suburban_dhaka' | 'outside_dhaka';

export type RegionOption = {
	id: string;
	name: string;
	nameBn: string | null;
	zone: Zone;
	parentId: string | null;
};

/** Districts plus their areas in one query — a few hundred rows, sent once. */
export async function getRegions(): Promise<{
	districts: RegionOption[];
	areasByDistrict: Record<string, RegionOption[]>;
}> {
	const rows = await db
		.select({
			id: regions.id,
			parentId: regions.parentId,
			name: regions.name,
			nameBn: regions.nameBn,
			zone: regions.zone
		})
		.from(regions)
		.where(eq(regions.active, true))
		.orderBy(asc(regions.sort), asc(regions.name));

	const districts = rows.filter((r) => !r.parentId) as RegionOption[];
	const areasByDistrict: Record<string, RegionOption[]> = {};
	for (const r of rows) {
		if (!r.parentId) continue;
		(areasByDistrict[r.parentId] ??= []).push(r as RegionOption);
	}
	return { districts, areasByDistrict };
}

/**
 * Resolves the authoritative zone for a chosen district/area. The area wins
 * when present — Savar is in Dhaka district but is not inside-Dhaka delivery.
 */
export async function resolveZone(
	districtId: string | null,
	areaId: string | null
): Promise<{ zone: Zone; district: string | null; area: string | null } | null> {
	if (!districtId) return null;

	const [district] = await db.select().from(regions).where(eq(regions.id, districtId)).limit(1);
	if (!district || district.parentId) return null;

	if (!areaId) return { zone: district.zone as Zone, district: district.name, area: null };

	const [area] = await db
		.select()
		.from(regions)
		.where(and(eq(regions.id, areaId), eq(regions.parentId, districtId)))
		.limit(1);
	if (!area) return { zone: district.zone as Zone, district: district.name, area: null };

	return { zone: area.zone as Zone, district: district.name, area: area.name };
}
