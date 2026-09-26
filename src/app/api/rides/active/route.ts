import { handle, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ACTIVE_STATUSES, expireStaleRequests, rideInclude, serializeRide } from "@/lib/rides";

// The signed-in rider's or driver's current ride, used to restore state on page load.
export const GET = handle(async () => {
    const user = await requireUser("RIDER", "DRIVER");
    const field = user.role === "DRIVER" ? "driverId" : "riderId";

    await expireStaleRequests({ [field]: user.id });
    const ride = await prisma.ride.findFirst({
        where: { [field]: user.id, status: { in: ACTIVE_STATUSES } },
        include: rideInclude,
        orderBy: { requestedAt: "desc" },
    });

    return Response.json({ ride: ride ? serializeRide(ride) : null });
});
