import { handle, HttpError, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { publish } from "@/lib/pusher-server";
import { channels, events } from "@/lib/realtime";
import { transitionRide } from "@/lib/rides";
import { readJson } from "@/lib/validate";

// Admin suspends or reinstates any non-admin account.
export const POST = handle(
    async (req: Request, { params }: { params: Promise<{ userId: string }> }) => {
        const admin = await requireUser("ADMIN");
        const { userId } = await params;
        const { suspended } = await readJson(req);
        if (typeof suspended !== "boolean") throw new HttpError(400, "suspended must be true or false");

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new HttpError(404, "User not found");
        if (user.role === "ADMIN") throw new HttpError(403, "Admins can't be suspended here");

        await prisma.user.update({
            where: { id: userId },
            data: { suspendedAt: suspended ? new Date() : null },
        });

        if (suspended) {
            // Close any ride they're waiting on so drivers aren't left hanging.
            const open = await prisma.ride.findMany({
                where: { riderId: userId, status: "REQUESTED" },
                select: { id: true },
            });
            for (const ride of open) {
                await transitionRide({
                    rideId: ride.id,
                    to: "CANCELLED",
                    actor: admin,
                    expectFrom: ["REQUESTED"],
                    data: { cancelledBy: "ADMIN", cancelReason: "Account suspended" },
                }).catch(() => {});
            }
            if (user.role === "DRIVER") {
                await prisma.driverProfile.updateMany({
                    where: { userId },
                    data: { isOnline: false },
                });
            }
        }
        console.info(`[admin] ${admin.email} ${suspended ? "suspended" : "reinstated"} ${userId}`);

        await publish(channels.user(userId), events.accountUpdated, { suspended });
        return Response.json({ suspended });
    },
);
