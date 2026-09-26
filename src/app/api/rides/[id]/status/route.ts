import { handle, HttpError, requireApprovedDriver } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeRide, transitionRide } from "@/lib/rides";
import { readJson } from "@/lib/validate";
import type { RideStatus } from "@/generated/prisma/client";

// Driver moves their ride forward: arrived -> trip started -> completed.
const NEXT: Partial<Record<string, RideStatus[]>> = {
    ARRIVED: ["ACCEPTED"],
    IN_PROGRESS: ["ARRIVED"],
    COMPLETED: ["IN_PROGRESS"],
};

export const POST = handle(
    async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
        const { id } = await params;
        const driver = await requireApprovedDriver();
        const { status } = await readJson(req);

        const expectFrom = typeof status === "string" ? NEXT[status] : undefined;
        if (!expectFrom) throw new HttpError(400, "Invalid status");

        const ride = await prisma.ride.findUnique({
            where: { id },
            select: { driverId: true },
        });
        if (!ride || ride.driverId !== driver.id) {
            throw new HttpError(404, "Ride not found");
        }

        const updated = await transitionRide({
            rideId: id,
            to: status as RideStatus,
            actor: driver,
            expectFrom,
        });

        return Response.json({ ride: serializeRide(updated) });
    },
);
