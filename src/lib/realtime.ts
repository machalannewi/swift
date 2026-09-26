// Channel and event names shared by the server and the browser.

export const channels = {
    /** Personal channel: ride offers for drivers, account updates. */
    user: (userId: string) => `private-user-${userId}`,
    /** All approved drivers of a car tier: requests that are no longer open. */
    driverTier: (tier: string) => `private-drivers-${tier}`,
    /** Everything about one ride: status changes and live driver location. */
    ride: (rideId: string) => `private-ride-${rideId}`,
};

export const events = {
    rideUpdated: "ride:updated",
    rideOffered: "ride:offered",
    rideUnavailable: "ride:unavailable",
    driverLocation: "driver:location",
} as const;

export type DriverLocationEvent = { lat: number; lng: number; at: string };
