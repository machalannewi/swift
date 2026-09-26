import { handle, HttpError, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { pusher } from "@/lib/pusher-server";
import { channels } from "@/lib/realtime";

// Authorizes a browser to subscribe to a private channel.
export const POST = handle(async (req: Request) => {
    const user = await requireUser();
    const form = await req.formData();
    const socketId = String(form.get("socket_id") ?? "");
    const channel = String(form.get("channel_name") ?? "");

    let allowed = false;

    if (channel === channels.user(user.id)) {
        allowed = true;
    } else if (channel === channels.admin) {
        allowed = user.role === "ADMIN";
    } else if (channel.startsWith("private-drivers-")) {
        const profile = user.driverProfile;
        allowed =
            user.role === "DRIVER" &&
            profile?.status === "APPROVED" &&
            channel === channels.driverTier(profile.carTier);
    } else if (channel.startsWith("private-ride-")) {
        const rideId = channel.slice("private-ride-".length);
        const ride = await prisma.ride.findUnique({
            where: { id: rideId },
            select: { riderId: true, driverId: true },
        });
        allowed =
            !!ride &&
            (ride.riderId === user.id ||
                ride.driverId === user.id ||
                user.role === "ADMIN");
    }

    if (!allowed) throw new HttpError(403, "Not allowed on this channel");

    return Response.json(pusher.authorizeChannel(socketId, channel));
});
