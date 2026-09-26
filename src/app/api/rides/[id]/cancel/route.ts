import { handle, HttpError, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeRide, transitionRide } from "@/lib/rides";

// Rider or assigned driver cancels a ride that hasn't started yet.
export const POST = handle(
    async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
        const { id } = await params;
        const user = await requireUser("RIDER", "DRIVER");

        const ride = await prisma.ride.findUnique({
            where: { id },
            select: { riderId: true, driverId: true },
        });
        const isParticipant =
            ride && (ride.riderId === user.id || ride.driverId === user.id);
        if (!isParticipant) throw new HttpError(404, "Ride not found");

        const body = await req.json().catch(() => ({}));
        const reason =
            typeof body?.reason === "string" ? body.reason.slice(0, 200) : null;

        const updated = await transitionRide({
            rideId: id,
            to: "CANCELLED",
            actor: user,
            expectFrom: ["REQUESTED", "ACCEPTED", "ARRIVED"],
            data: {
                cancelledBy: user.role,
                cancelReason:
                    reason ??
                    (user.role === "DRIVER" ? "Cancelled by driver" : "Cancelled by rider"),
            },
        });

        return Response.json({ ride: serializeRide(updated) });
    },
);
