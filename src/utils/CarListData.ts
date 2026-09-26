// Car tiers shown to riders and drivers. Prices live in the database
// (PricingTier) and are edited in /admin/pricing.

export type CarTier = "SWIFT_X" | "SWIFT_COMFORT" | "SWIFT_XL";

export interface CarData {
    id: number;
    tier: CarTier;
    name: string;
    seat: number;
    desc: string;
}

export const carListData: CarData[] = [
    { id: 1, tier: "SWIFT_X", name: "Swift X", seat: 4, desc: "Affordable rides" },
    { id: 2, tier: "SWIFT_COMFORT", name: "Swift Comfort", seat: 4, desc: "Extra legroom" },
    { id: 3, tier: "SWIFT_XL", name: "Swift XL", seat: 6, desc: "Groups up to 6" },
];

export const getCar = (tier: string) => carListData.find((c) => c.tier === tier);

export const formatNaira = (amount: number) =>
    `₦${Math.round(amount).toLocaleString()}`;
