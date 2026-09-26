// Channel and event names shared by the server and the browser.

export const channels = {
    /** Personal channel: ride offers for drivers, account updates. */
    user: (userId: string) => `private-user-${userId}`,
    /** All approved drivers of a car tier: requests that are no longer open. */
    driverTier: (tier: string) => `private-drivers-${tier}`,
    /** Public: fares changed (rates or surge) - riders refresh their quotes. */
    pricing: "pricing",
    /** Admins only: every ride and driver change across the platform. */
    admin: "private-admin",
    /** Everything about one ride: status changes and live driver location. */
    ride: (rideId: string) => `private-ride-${rideId}`,
};

export const events = {
    rideUpdated: "ride:updated",
    rideOffered: "ride:offered",
    rideUnavailable: "ride:unavailable",
    driverLocation: "driver:location",
    /** A driver went online/offline or was approved/suspended. */
    driverUpdated: "driver:updated",
    /** The user's own account changed (approval, suspension) - reload. */
    accountUpdated: "account:updated",
    pricingUpdated: "pricing:updated",
} as const;

export type DriverLocationEvent = { lat: number; lng: number; at: string };
