import "server-only";
import { prisma } from "@/lib/prisma";
import { carListData } from "@/utils/CarListData";
import type { TierPricing } from "@/utils/pricing";
import type { PricingTier } from "@/generated/prisma/client";

const toPricing = (row: PricingTier): TierPricing => ({
    tier: row.tier,
    baseFare: row.baseFare,
    perKm: row.perKm,
    perMinute: row.perMinute,
    minimumFare: row.minimumFare,
    bookingFee: row.bookingFee,
    surgeMultiplier: row.surgeMultiplier,
    surgeNote: row.surgeNote,
});

/** Current pricing for every tier, in car-list order. */
export async function getAllPricing(): Promise<TierPricing[]> {
    const rows = await prisma.pricingTier.findMany();
    return carListData
        .map((car) => rows.find((r) => r.tier === car.tier))
        .filter((r): r is PricingTier => !!r)
        .map(toPricing);
}

export async function getPricing(tier: string): Promise<TierPricing | null> {
    const row = await prisma.pricingTier.findUnique({ where: { tier } });
    return row ? toPricing(row) : null;
}
