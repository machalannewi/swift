import { useCallback, useEffect, useState } from "react";

export interface Ride {
    id: string;
    pickup: string;
    dropoff: string;
    carName: string;
    fare: number;
    distanceKm: number;
    durationMin: number;
    createdAt: string;
}

// Stored per browser until rides are persisted with Prisma.
const STORAGE_KEY = "swift:ride-history";

function readRides(): Ride[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? (JSON.parse(raw) as Ride[]) : [];
    } catch {
        return [];
    }
}

export function useRideHistory() {
    const [rides, setRides] = useState<Ride[]>([]);
    const [isLoaded, setIsLoaded] = useState<boolean>(false);

    useEffect(() => {
        setRides(readRides());
        setIsLoaded(true);
    }, []);

    const addRide = useCallback((ride: Omit<Ride, "id" | "createdAt">) => {
        const newRide: Ride = {
            ...ride,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
        };
        const next = [newRide, ...readRides()];
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
            // Storage unavailable (private mode) - keep the ride in memory only
        }
        setRides(next);
        return newRide;
    }, []);

    const clearRides = useCallback(() => {
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch {}
        setRides([]);
    }, []);

    return { rides, isLoaded, addRide, clearRides };
}
