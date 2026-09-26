import { handle, HttpError, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { publish } from "@/lib/pusher-server";
import { channels, events } from "@/lib/realtime";
import { ACTIVE_STATUSES } from "@/lib/rides";
import { readJson } from "@/lib/validate";
import type { DriverStatus } from "@/generated/prisma/client";

const STATUSES: DriverStatus[] = ["PENDING", "APPROVED", "REJECTED", "SUSPENDED"];

// Admin approves, rejects, suspends or reinstates a driver.
export const POST = handle(
    async (req: Request, { params }: { params: Promise<{ userId: string }> }) => {
        const admin = await requireUser("ADMIN");
        const { userId } = await params;
        const { status } = await readJson(req);
        if (!STATUSES.includes(status as DriverStatus)) {
            throw new HttpError(400, "Invalid status");
        }

        const profile = await prisma.driverProfile.findUnique({ where: { userId } });
        if (!profile) throw new HttpError(404, "Driver not found");

        if (status !== "APPROVED") {
            const onTrip = await prisma.ride.findFirst({
                where: { driverId: userId, status: { in: ACTIVE_STATUSES } },
                select: { id: true },
            });
            if (onTrip) {
                throw new HttpError(409, "Driver is on a trip - cancel it first from Rides");
            }
        }

        const updated = await prisma.driverProfile.update({
            where: { userId },
            data: {
                status: status as DriverStatus,
                ...(status === "APPROVED" ? {} : { isOnline: false }),
            },
        });
        console.info(`[admin] ${admin.email} set driver ${userId} to ${status}`);

        await publish(channels.user(userId), events.accountUpdated, { driverStatus: status });
        await publish(channels.admin, events.driverUpdated, {
            userId,
            status,
            isOnline: updated.isOnline,
        });

        return Response.json({ status: updated.status });
    },
);
