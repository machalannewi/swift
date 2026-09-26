import { handle, HttpError, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { expireStaleRequests, rideInclude, serializeRide } from "@/lib/rides";

// A single ride, visible to its rider, its driver, or an admin.
export const GET = handle(
    async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
        const { id } = await params;
        const user = await requireUser();

        await expireStaleRequests({ id });
        const ride = await prisma.ride.findUnique({ where: { id }, include: rideInclude });
        const canSee =
            ride &&
            (ride.riderId === user.id || ride.driverId === user.id || user.role === "ADMIN");
        if (!canSee) throw new HttpError(404, "Ride not found");

        return Response.json({ ride: serializeRide(ride) });
    },
);
