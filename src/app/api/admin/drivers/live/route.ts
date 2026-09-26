import { handle, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ACTIVE_STATUSES } from "@/lib/rides";

// Positions of online drivers for the admin live map.
export const GET = handle(async () => {
    await requireUser("ADMIN");
    const drivers = await prisma.driverProfile.findMany({
        where: {
            isOnline: true,
            status: "APPROVED",
            lastLat: { not: null },
            lastSeenAt: { gte: new Date(Date.now() - 5 * 60 * 1000) },
        },
        select: {
            userId: true,
            carTier: true,
            plateNumber: true,
            lastLat: true,
            lastLng: true,
            user: {
                select: {
                    name: true,
                    ridesAsDriver: {
                        where: { status: { in: ACTIVE_STATUSES } },
                        select: { id: true },
                        take: 1,
                    },
                },
            },
        },
    });

    return Response.json({
        drivers: drivers.map((d) => ({
            userId: d.userId,
            name: d.user.name,
            carTier: d.carTier,
            plateNumber: d.plateNumber,
            lat: d.lastLat!,
            lng: d.lastLng!,
            onTrip: d.user.ridesAsDriver.length > 0,
        })),
    });
});
