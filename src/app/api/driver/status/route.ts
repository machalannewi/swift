import { handle, HttpError, requireApprovedDriver } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ACTIVE_STATUSES } from "@/lib/rides";
import { readJson, requireCoords } from "@/lib/validate";
import { publish } from "@/lib/pusher-server";
import { channels, events } from "@/lib/realtime";

// Driver goes online (with their position) or offline.
export const POST = handle(async (req: Request) => {
    const driver = await requireApprovedDriver();
    const body = await readJson(req);
    const online = body.online === true;

    if (!online) {
        const active = await prisma.ride.findFirst({
            where: { driverId: driver.id, status: { in: ACTIVE_STATUSES } },
            select: { id: true },
        });
        if (active) throw new HttpError(409, "Finish your current ride before going offline");
    }

    const coords = online ? requireCoords(body.location, "location") : null;

    const profile = await prisma.driverProfile.update({
        where: { userId: driver.id },
        data: {
            isOnline: online,
            ...(coords
                ? { lastLat: coords.lat, lastLng: coords.lng, lastSeenAt: new Date() }
                : {}),
        },
        select: { isOnline: true },
    });

    await publish(channels.admin, events.driverUpdated, {
        userId: driver.id,
        isOnline: profile.isOnline,
    });

    return Response.json(profile);
});
