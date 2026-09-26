import { handle, requireApprovedDriver } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { publish } from "@/lib/pusher-server";
import { channels, events, type DriverLocationEvent } from "@/lib/realtime";
import { readJson, requireCoords } from "@/lib/validate";

// Periodic GPS ping from an online driver. Forwarded live to their current rider.
export const POST = handle(async (req: Request) => {
    const driver = await requireApprovedDriver();
    const { lat, lng } = requireCoords(await readJson(req), "location");
    const now = new Date();

    await prisma.driverProfile.update({
        where: { userId: driver.id },
        data: { lastLat: lat, lastLng: lng, lastSeenAt: now },
    });

    const ride = await prisma.ride.findFirst({
        where: { driverId: driver.id, status: { in: ["ACCEPTED", "ARRIVED", "IN_PROGRESS"] } },
        select: { id: true },
    });
    if (ride) {
        const payload: DriverLocationEvent = { lat, lng, at: now.toISOString() };
        await publish(channels.ride(ride.id), events.driverLocation, payload);
    }

    return Response.json({ ok: true });
});
