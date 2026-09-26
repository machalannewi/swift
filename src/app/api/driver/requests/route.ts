import { handle, requireApprovedDriver } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
    distanceKm,
    expireStaleRequests,
    MATCH_RADIUS_KM,
    rideInclude,
    serializeRide,
} from "@/lib/rides";

// Open requests near the driver - fetched when they come online so they
// also see requests made before they connected.
export const GET = handle(async () => {
    const driver = await requireApprovedDriver();
    const { carTier, lastLat, lastLng } = driver.driverProfile;
    if (lastLat == null || lastLng == null) return Response.json({ rides: [] });

    await expireStaleRequests({ carTier });
    const open = await prisma.ride.findMany({
        where: { status: "REQUESTED", carTier },
        include: rideInclude,
        orderBy: { requestedAt: "asc" },
        take: 50,
    });

    const nearby = open.filter(
        (r) => distanceKm(lastLat, lastLng, r.pickupLat, r.pickupLng) <= MATCH_RADIUS_KM,
    );
    return Response.json({ rides: nearby.map(serializeRide) });
});
