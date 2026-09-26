// Client-safe ride types - mirrors serializeRide() in src/lib/rides.ts.

export type RideStatus =
    | "REQUESTED"
    | "ACCEPTED"
    | "ARRIVED"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "CANCELLED";

export interface Place {
    name: string;
    lat: number;
    lng: number;
}

export interface RideDTO {
    id: string;
    status: RideStatus;
    carTier: string;
    pickup: Place;
    dropoff: Place;
    distanceMeters: number;
    durationSeconds: number;
    fare: number;
    requestedAt: string;
    acceptedAt: string | null;
    completedAt: string | null;
    cancelReason: string | null;
    cancelledBy: "RIDER" | "DRIVER" | "ADMIN" | null;
    rider: { id: string; name: string | null; imageUrl: string | null };
    driver: {
        id: string;
        name: string | null;
        imageUrl: string | null;
        phone: string;
        vehicle: string;
        plateNumber: string;
        location: { lat: number; lng: number } | null;
    } | null;
}

export const ACTIVE_RIDE_STATUSES: RideStatus[] = [
    "REQUESTED",
    "ACCEPTED",
    "ARRIVED",
    "IN_PROGRESS",
];
