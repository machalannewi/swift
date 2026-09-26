import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api-client";

type Coords = { lat: number; lng: number };

/** One-off position read, used when going online. */
export function getPosition(): Promise<Coords> {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error("Location is not supported by this browser"));
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
            () => reject(new Error("Allow location access to go online")),
            { enableHighAccuracy: true, timeout: 15000 },
        );
    });
}

/**
 * While `enabled`, watches the device GPS and reports it to the server:
 * every few seconds during a trip (the rider sees it live), otherwise as a
 * slower heartbeat that keeps the driver matchable.
 */
export function useDriverLocation(enabled: boolean, onTrip: boolean) {
    const [position, setPosition] = useState<Coords | null>(null);
    const latest = useRef<Coords | null>(null);

    useEffect(() => {
        if (!enabled || !navigator.geolocation) return;
        const id = navigator.geolocation.watchPosition(
            (p) => {
                const coords = { lat: p.coords.latitude, lng: p.coords.longitude };
                latest.current = coords;
                setPosition(coords);
            },
            (err) => console.warn("Location watch failed", err),
            { enableHighAccuracy: true, maximumAge: 5000 },
        );
        return () => navigator.geolocation.clearWatch(id);
    }, [enabled]);

    useEffect(() => {
        if (!enabled) return;
        const send = () => {
            if (latest.current) {
                api("/api/driver/location", { body: latest.current }).catch(() => {});
            }
        };
        const timer = setInterval(send, onTrip ? 5000 : 30000);
        return () => clearInterval(timer);
    }, [enabled, onTrip]);

    return position;
}
