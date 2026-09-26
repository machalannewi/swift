import { handle, HttpError, requireApprovedDriver } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ACTIVE_STATUSES, serializeRide, transitionRide } from "@/lib/rides";

// Driver accepts an open request. First driver wins; others get a 409.
export const POST = handle(
    async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
        const { id } = await params;
        const driver = await requireApprovedDriver();

        const busy = await prisma.ride.findFirst({
            where: { driverId: driver.id, status: { in: ACTIVE_STATUSES } },
            select: { id: true },
        });
        if (busy) throw new HttpError(409, "Finish your current ride first");

        const ride = await prisma.ride.findUnique({
            where: { id },
            select: { carTier: true },
        });
        if (!ride) throw new HttpError(404, "Ride not found");
        if (ride.carTier !== driver.driverProfile.carTier) {
            throw new HttpError(403, "This ride needs a different vehicle type");
        }

        const updated = await transitionRide({
            rideId: id,
            to: "ACCEPTED",
            actor: driver,
            expectFrom: ["REQUESTED"],
            data: { driverId: driver.id },
        });

        return Response.json({ ride: serializeRide(updated) });
    },
);
