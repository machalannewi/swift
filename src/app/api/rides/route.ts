import { handle, HttpError, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDrivingRoute } from "@/lib/mapbox-server";
import { publish } from "@/lib/pusher-server";
import { channels, events } from "@/lib/realtime";
import {
    ACTIVE_STATUSES,
    expireStaleRequests,
    findNearbyDrivers,
    rideInclude,
    serializeRide,
} from "@/lib/rides";
import { calculateFare, getCar } from "@/utils/CarListData";
import { readJson, requireCoords, requireString } from "@/lib/validate";

// Rider requests a ride.
export const POST = handle(async (req: Request) => {
    const rider = await requireUser("RIDER");
    const body = await readJson(req);

    const car = getCar(requireString(body.carTier, "carTier", 40));
    if (!car) throw new HttpError(400, "Unknown car tier");

    const pickup = requireCoords(body.pickup, "pickup");
    const dropoff = requireCoords(body.dropoff, "dropoff");
    const pickupName = requireString((body.pickup as { name?: unknown }).name, "pickup name");
    const dropoffName = requireString((body.dropoff as { name?: unknown }).name, "dropoff name");

    await expireStaleRequests({ riderId: rider.id });
    const existing = await prisma.ride.findFirst({
        where: { riderId: rider.id, status: { in: ACTIVE_STATUSES } },
        select: { id: true },
    });
    if (existing) throw new HttpError(409, "You already have a ride in progress");

    const route = await getDrivingRoute(pickup, dropoff);

    const ride = await prisma.ride.create({
        data: {
            riderId: rider.id,
            carTier: car.tier,
            pickupName,
            pickupLat: pickup.lat,
            pickupLng: pickup.lng,
            dropoffName,
            dropoffLat: dropoff.lat,
            dropoffLng: dropoff.lng,
            distanceMeters: route.distanceMeters,
            durationSeconds: route.durationSeconds,
            fare: calculateFare(car, route.distanceMeters),
        },
        include: rideInclude,
    });

    const drivers = await findNearbyDrivers(ride);
    await prisma.rideEvent.create({
        data: {
            rideId: ride.id,
            status: "REQUESTED",
            actorId: rider.id,
            data: { offeredTo: drivers.map((d) => d.userId) },
        },
    });

    const payload = serializeRide(ride);
    await publish(
        drivers.map((d) => channels.user(d.userId)),
        events.rideOffered,
        payload,
    );

    return Response.json({ ride: payload, driversNotified: drivers.length }, { status: 201 });
});
