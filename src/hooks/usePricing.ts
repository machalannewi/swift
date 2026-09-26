import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { useChannelEvent } from "@/hooks/useChannelEvent";
import { channels, events } from "@/lib/realtime";
import type { TierPricing } from "@/utils/pricing";

/** Current rates and surge per tier; refreshes live when an admin changes them. */
export function usePricing() {
    const [pricing, setPricing] = useState<TierPricing[] | null>(null);
    const [error, setError] = useState("");

    const reload = useCallback(async () => {
        try {
            const { pricing } = await api<{ pricing: TierPricing[] }>("/api/pricing");
            setPricing(pricing);
            setError("");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not load prices");
        }
    }, []);

    useEffect(() => {
        reload();
    }, [reload]);

    useChannelEvent(channels.pricing, events.pricingUpdated, reload);

    const forTier = useCallback(
        (tier: string) => pricing?.find((p) => p.tier === tier) ?? null,
        [pricing],
    );

    return { pricing, forTier, reload, error };
}
