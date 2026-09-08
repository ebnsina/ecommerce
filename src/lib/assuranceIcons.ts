import type { IconComponent } from '$lib/icons';
/** The icons an owner can pick for a reassurance, shared by every place that
    renders them — the product page and the footer band. */
import { Truck, RotateCcw, ShieldCheck, Banknote, Phone, Check } from '@lucide/svelte';

export const assuranceIcons: Record<string, IconComponent> = {
	Truck,
	RotateCcw,
	ShieldCheck,
	Banknote,
	Phone,
	Check
};

export const assuranceIcon = (name: string) => assuranceIcons[name] ?? Truck;
