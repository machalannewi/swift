import { handle, requireUser } from "@/lib/auth";
import { serializeRide, transitionRide } from "@/lib/rides";

// Admin force-cancels any unfinished ride (e.g. a stuck trip).
export const POST = handle(
    async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
        const admin = await requireUser("ADMIN");
        const { id } = await params;
        const body = await req.json().catch(() => ({}));
        const reason =
            typeof body?.reason === "string" && body.reason.trim()
                ? body.reason.trim().slice(0, 200)
                : "Cancelled by Swift support";

        const updated = await transitionRide({
            rideId: id,
            to: "CANCELLED",
            actor: admin,
            expectFrom: ["REQUESTED", "ACCEPTED", "ARRIVED", "IN_PROGRESS"],
            data: { cancelledBy: "ADMIN", cancelReason: reason },
        });

        return Response.json({ ride: serializeRide(updated) });
    },
);
