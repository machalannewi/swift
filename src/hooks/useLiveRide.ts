import { useCallback, useEffect, useState } from "react";
import { useChannelEvent } from "@/hooks/useChannelEvent";
import { channels, events, type DriverLocationEvent } from "@/lib/realtime";
import { api } from "@/lib/api-client";
import { ACTIVE_RIDE_STATUSES, type RideDTO } from "@/types/ride";

// Safety net in case a real-time message is missed (e.g. network blip).
const REFRESH_MS = 20_000;

/**
 * Keeps a ride in sync via Pusher: status changes and live driver location.
 * Loads the user's active ride on mount so a refresh doesn't lose it.
 */
export function useLiveRide() {
    const [ride, setRide] = useState<RideDTO | null>(null);
    const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const updateRide = useCallback((next: RideDTO | null) => {
        setRide(next);
        if (next?.driver?.location) setDriverLocation(next.driver.location);
        if (!next) setDriverLocation(null);
    }, []);

    useEffect(() => {
        api<{ ride: RideDTO | null }>("/api/rides/active")
            .then(({ ride }) => updateRide(ride))
            .catch((err) => console.error("Failed to load active ride", err))
            .finally(() => setIsLoading(false));
    }, [updateRide]);

    const isActive = !!ride && ACTIVE_RIDE_STATUSES.includes(ride.status);
    const channel = ride && isActive ? channels.ride(ride.id) : null;

    useChannelEvent<RideDTO>(channel, events.rideUpdated, updateRide);
    useChannelEvent<DriverLocationEvent>(channel, events.driverLocation, ({ lat, lng }) =>
        setDriverLocation({ lat, lng }),
    );

    const rideId = ride?.id;
    useEffect(() => {
        if (!rideId || !isActive) return;
        const timer = setInterval(() => {
            api<{ ride: RideDTO }>(`/api/rides/${rideId}`)
                .then(({ ride }) => updateRide(ride))
                .catch(() => {});
        }, REFRESH_MS);
        return () => clearInterval(timer);
    }, [rideId, isActive, updateRide]);

    return { ride, setRide: updateRide, driverLocation, isLoading, isActive };
}
