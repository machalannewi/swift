import "server-only";
import { prisma } from "@/lib/prisma";
import { publish } from "@/lib/pusher-server";
import { channels, events } from "@/lib/realtime";
import { HttpError } from "@/lib/auth";
import type { Prisma, Role, RideStatus } from "@/generated/prisma/client";

/** Drivers within this distance of the pickup are offered the ride. */
export const MATCH_RADIUS_KM = 15;
/** Requests nobody accepts within this window are cancelled. */
export const REQUEST_TIMEOUT_MS = 3 * 60 * 1000;
/** Drivers who haven't sent a location recently are treated as offline. */
const DRIVER_STALE_MS = 2 * 60 * 1000;

export const ACTIVE_STATUSES: RideStatus[] = [
    "REQUESTED",
    "ACCEPTED",
    "ARRIVED",
    "IN_PROGRESS",
];

// Which statuses a ride may move to next.
const TRANSITIONS: Record<RideStatus, RideStatus[]> = {
    REQUESTED: ["ACCEPTED", "CANCELLED"],
    ACCEPTED: ["ARRIVED", "CANCELLED"],
    ARRIVED: ["IN_PROGRESS", "CANCELLED"],
    IN_PROGRESS: ["COMPLETED"],
    COMPLETED: [],
    CANCELLED: [],
};

const TIMESTAMP_FIELD: Partial<Record<RideStatus, keyof Prisma.RideUpdateInput>> = {
    ACCEPTED: "acceptedAt",
    ARRIVED: "arrivedAt",
    IN_PROGRESS: "startedAt",
    COMPLETED: "completedAt",
    CANCELLED: "cancelledAt",
};

const personSelect = { id: true, name: true, imageUrl: true } as const;

export const rideInclude = {
    rider: { select: personSelect },
    driver: {
        select: {
            ...personSelect,
            driverProfile: {
                select: {
                    vehicleMake: true,
                    vehicleModel: true,
                    vehicleColor: true,
                    plateNumber: true,
                    phone: true,
                    lastLat: true,
                    lastLng: true,
                },
            },
        },
    },
} satisfies Prisma.RideInclude;

export type RideWithPeople = Prisma.RideGetPayload<{ include: typeof rideInclude }>;

/** Distance between two coordinates in kilometres (haversine). */
export function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number) {
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(bLat - aLat);
    const dLng = toRad(bLng - aLng);
    const h =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
    return 6371 * 2 * Math.asin(Math.sqrt(h));
}

/** Approved, online, idle drivers of the right tier near the pickup. */
export async function findNearbyDrivers(ride: {
    carTier: string;
    pickupLat: number;
    pickupLng: number;
}) {
    const candidates = await prisma.driverProfile.findMany({
        where: {
            status: "APPROVED",
            isOnline: true,
            carTier: ride.carTier,
            lastLat: { not: null },
            lastLng: { not: null },
            lastSeenAt: { gte: new Date(Date.now() - DRIVER_STALE_MS) },
            user: { ridesAsDriver: { none: { status: { in: ACTIVE_STATUSES } } } },
        },
        select: { userId: true, lastLat: true, lastLng: true },
    });

    return candidates.filter(
        (d) =>
            distanceKm(ride.pickupLat, ride.pickupLng, d.lastLat!, d.lastLng!) <=
            MATCH_RADIUS_KM,
    );
}

/**
 * Moves a ride to a new status atomically. `expectFrom` guards against races:
 * the update only succeeds if the ride is still in one of those statuses, so
 * e.g. two drivers can't both accept the same request.
 */
export async function transitionRide(opts: {
    rideId: string;
    to: RideStatus;
    actor: { id: string; role: Role };
    expectFrom?: RideStatus[];
    data?: Prisma.RideUncheckedUpdateManyInput;
    eventData?: Prisma.InputJsonValue;
}) {
    const { rideId, to, actor } = opts;
    const allowedFrom =
        opts.expectFrom ??
        (Object.keys(TRANSITIONS) as RideStatus[]).filter((s) =>
            TRANSITIONS[s].includes(to),
        );

    const timestampField = TIMESTAMP_FIELD[to];
    const updated = await prisma.$transaction(async (tx) => {
        const { count } = await tx.ride.updateMany({
            where: { id: rideId, status: { in: allowedFrom } },
            data: {
                ...opts.data,
                status: to,
                ...(timestampField ? { [timestampField]: new Date() } : {}),
            },
        });
        if (count === 0) return null;

        await tx.rideEvent.create({
            data: { rideId, status: to, actorId: actor.id, data: opts.eventData },
        });
        return tx.ride.findUniqueOrThrow({ where: { id: rideId }, include: rideInclude });
    });

    if (!updated) {
        throw new HttpError(409, "This ride can no longer be updated");
    }

    await broadcastRide(updated);
    return updated;
}

/** Pushes the latest ride state to everyone watching it. */
export async function broadcastRide(ride: RideWithPeople) {
    await publish(
        [channels.ride(ride.id), channels.admin],
        events.rideUpdated,
        serializeRide(ride),
    );

    // Once a request is no longer open, pull it from other drivers' screens.
    if (ride.status !== "REQUESTED") {
        await publish(channels.driverTier(ride.carTier), events.rideUnavailable, {
            rideId: ride.id,
        });
    }
}

/**
 * Cancels a request nobody accepted in time. Called lazily whenever a rider
 * or driver loads rides, so no background job is needed.
 */
export async function expireStaleRequests(where: Prisma.RideWhereInput = {}) {
    const stale = await prisma.ride.findMany({
        where: {
            ...where,
            status: "REQUESTED",
            requestedAt: { lt: new Date(Date.now() - REQUEST_TIMEOUT_MS) },
        },
        select: { id: true, riderId: true },
    });

    for (const ride of stale) {
        await transitionRide({
            rideId: ride.id,
            to: "CANCELLED",
            actor: { id: ride.riderId, role: "RIDER" },
            expectFrom: ["REQUESTED"],
            data: { cancelReason: "No drivers available" },
            eventData: { reason: "timeout" },
        }).catch(() => {
            // Already accepted or cancelled in the meantime - nothing to do.
        });
    }
}

/** The shape sent to browsers (via API responses and Pusher). */
export function serializeRide(ride: RideWithPeople) {
    const profile = ride.driver?.driverProfile;
    return {
        id: ride.id,
        status: ride.status,
        carTier: ride.carTier,
        pickup: { name: ride.pickupName, lat: ride.pickupLat, lng: ride.pickupLng },
        dropoff: { name: ride.dropoffName, lat: ride.dropoffLat, lng: ride.dropoffLng },
        distanceMeters: ride.distanceMeters,
        durationSeconds: ride.durationSeconds,
        fare: ride.fare,
        requestedAt: ride.requestedAt.toISOString(),
        acceptedAt: ride.acceptedAt?.toISOString() ?? null,
        completedAt: ride.completedAt?.toISOString() ?? null,
        cancelReason: ride.cancelReason,
        cancelledBy: ride.cancelledBy,
        rider: { id: ride.rider.id, name: ride.rider.name, imageUrl: ride.rider.imageUrl },
        driver:
            ride.driver && profile
                ? {
                      id: ride.driver.id,
                      name: ride.driver.name,
                      imageUrl: ride.driver.imageUrl,
                      phone: profile.phone,
                      vehicle: `${profile.vehicleColor} ${profile.vehicleMake} ${profile.vehicleModel}`,
                      plateNumber: profile.plateNumber,
                      location:
                          profile.lastLat != null && profile.lastLng != null
                              ? { lat: profile.lastLat, lng: profile.lastLng }
                              : null,
                  }
                : null,
    };
}
