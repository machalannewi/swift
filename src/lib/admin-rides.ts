import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import type { RideWithPeople } from "@/lib/rides";
import { TIMEZONE } from "@/lib/analytics";

export const STATUS_FILTERS = [
    { key: "all", label: "All" },
    { key: "COMPLETED", label: "Completed" },
    { key: "CANCELLED", label: "Cancelled" },
] as const;

export const PERIODS = [
    { key: "today", label: "Today" },
    { key: "7d", label: "7 days" },
    { key: "30d", label: "30 days" },
    { key: "all", label: "All time" },
] as const;

/** Midnight today in the platform timezone (Africa/Lagos is UTC+1, no DST). */
function startOfToday() {
    const date = new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE }).format(new Date());
    return new Date(`${date}T00:00:00+01:00`);
}

function periodStart(period: string): Date | null {
    if (period === "today") return startOfToday();
    if (period === "7d") return new Date(Date.now() - 7 * 86_400_000);
    if (period === "30d") return new Date(Date.now() - 30 * 86_400_000);
    return null;
}

/**
 * Search across everything an admin might know about a trip: ride ID,
 * rider or driver name/email, plate number, pickup or dropoff place.
 */
export function rideSearchWhere(opts: {
    q?: string;
    status?: string;
    period?: string;
    driverId?: string;
}): Prisma.RideWhereInput {
    const q = opts.q?.trim().slice(0, 100);
    const text = (field: string) => ({ [field]: { contains: q, mode: "insensitive" as const } });
    const since = periodStart(opts.period ?? "all");

    return {
        AND: [
            opts.status === "COMPLETED" || opts.status === "CANCELLED" ? { status: opts.status } : {},
            since ? { requestedAt: { gte: since } } : {},
            opts.driverId ? { driverId: opts.driverId } : {},
            q
                ? {
                      OR: [
                          { id: q },
                          text("pickupName"),
                          text("dropoffName"),
                          { rider: { OR: [text("name"), text("email")] } },
                          {
                              driver: {
                                  OR: [
                                      text("name"),
                                      text("email"),
                                      { driverProfile: text("plateNumber") },
                                  ],
                              },
                          },
                      ],
                  }
                : {},
        ],
    };
}

/** A trip that has sat in one state far longer than it should. */
export function stuckReason(ride: RideWithPeople): string | null {
    const mins = (d: Date | null) => (d ? (Date.now() - d.getTime()) / 60000 : 0);
    if (ride.status === "ACCEPTED" && mins(ride.acceptedAt) > 30)
        return "Driver hasn't arrived after 30+ min";
    if (ride.status === "ARRIVED" && mins(ride.arrivedAt) > 15)
        return "Trip not started 15+ min after arrival";
    if (ride.status === "IN_PROGRESS" && mins(ride.startedAt) > (ride.durationSeconds / 60) * 2 + 20)
        return "Trip running far longer than expected";
    return null;
}
