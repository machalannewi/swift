// Fare formula shared by the browser (quotes) and the server (the charge),
// so both always agree.

export interface TierPricing {
    tier: string;
    baseFare: number;
    perKm: number;
    perMinute: number;
    minimumFare: number;
    bookingFee: number;
    /** 1 = no surge */
    surgeMultiplier: number;
    surgeNote: string | null;
}

export interface FareBreakdown {
    baseFare: number;
    distanceFare: number;
    timeFare: number;
    /** Extra added by surge (0 when off). */
    surgeAmount: number;
    /** Top-up so the ride fare reaches the minimum (0 when not needed). */
    minimumTopUp: number;
    bookingFee: number;
    surgeMultiplier: number;
    total: number;
}

/**
 * fare = max(minimum, (base + perKm × km + perMinute × min) × surge) + booking fee
 * Surge applies to the ride itself, never to the booking fee.
 */
export function calculateFare(
    pricing: TierPricing,
    distanceMeters: number,
    durationSeconds: number,
): FareBreakdown {
    const baseFare = pricing.baseFare;
    const distanceFare = Math.round((pricing.perKm * distanceMeters) / 1000);
    const timeFare = Math.round((pricing.perMinute * durationSeconds) / 60);
    const rideFare = baseFare + distanceFare + timeFare;
    const surged = Math.round(rideFare * pricing.surgeMultiplier);
    const surgeAmount = surged - rideFare;
    const minimumTopUp = Math.max(0, pricing.minimumFare - surged);

    return {
        baseFare,
        distanceFare,
        timeFare,
        surgeAmount,
        minimumTopUp,
        bookingFee: pricing.bookingFee,
        surgeMultiplier: pricing.surgeMultiplier,
        total: surged + minimumTopUp + pricing.bookingFee,
    };
}

export const isSurging = (p: { surgeMultiplier: number }) => p.surgeMultiplier > 1;

export const SURGE_LIMITS = { min: 1, max: 3 };
