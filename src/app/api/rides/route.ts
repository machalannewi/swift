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
import { getCar } from "@/utils/CarListData";
import { calculateFare } from "@/utils/pricing";
import { getPricing } from "@/lib/pricing";
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

    const pricing = await getPricing(car.tier);
    if (!pricing) throw new HttpError(503, "This vehicle type isn't available right now");

    // The rider saw a quote with a given surge; if surge changed since, ask them to review.
    if (
        typeof body.expectedSurge === "number" &&
        Math.abs(body.expectedSurge - pricing.surgeMultiplier) > 0.001
    ) {
        throw new HttpError(409, "Prices just changed. Please review the new fare and request again.");
    }
    const fare = calculateFare(pricing, route.distanceMeters, route.durationSeconds);

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
            fare: fare.total,
            baseFare: fare.baseFare,
            distanceFare: fare.distanceFare,
            timeFare: fare.timeFare,
            bookingFee: fare.bookingFee,
            surgeMultiplier: fare.surgeMultiplier,
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
    await publish(channels.admin, events.rideUpdated, payload);

    return Response.json({ ride: payload, driversNotified: drivers.length }, { status: 201 });
});
