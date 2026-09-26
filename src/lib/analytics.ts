import "server-only";
import { prisma } from "@/lib/prisma";
import { ACTIVE_STATUSES, rideInclude } from "@/lib/rides";

/** Days and "today" are counted in the platform's local time. */
export const TIMEZONE = "Africa/Lagos";

export type DailyRides = { day: string; completed: number; cancelled: number };

export async function getOverview() {
    const [today] = await prisma.$queryRaw<
        { requested: number; completed: number; cancelled: number; revenue: number }[]
    >`
        WITH bounds AS (
            SELECT date_trunc('day', now() AT TIME ZONE ${TIMEZONE}) AT TIME ZONE ${TIMEZONE} AS start
        )
        SELECT COUNT(*)::int AS requested,
               COUNT(*) FILTER (WHERE status = 'COMPLETED')::int AS completed,
               COUNT(*) FILTER (WHERE status = 'CANCELLED')::int AS cancelled,
               COALESCE(SUM(fare) FILTER (WHERE status = 'COMPLETED'), 0)::int AS revenue
        FROM "Ride", bounds
        WHERE ("requestedAt" AT TIME ZONE 'UTC') >= bounds.start
    `;

    const [timings] = await prisma.$queryRaw<
        {
            accept_s: number | null;
            pickup_s: number | null;
            trip_s: number | null;
            finished: number;
            completed: number;
        }[]
    >`
        SELECT AVG(EXTRACT(EPOCH FROM ("acceptedAt" - "requestedAt")))::float AS accept_s,
               AVG(EXTRACT(EPOCH FROM ("arrivedAt" - "acceptedAt")))::float AS pickup_s,
               AVG(EXTRACT(EPOCH FROM ("completedAt" - "startedAt")))::float AS trip_s,
               COUNT(*) FILTER (WHERE status IN ('COMPLETED', 'CANCELLED'))::int AS finished,
               COUNT(*) FILTER (WHERE status = 'COMPLETED')::int AS completed
        FROM "Ride"
        WHERE "requestedAt" >= (now() AT TIME ZONE 'UTC') - interval '7 days'
    `;

    const dailyRows = await prisma.$queryRaw<DailyRides[]>`
        SELECT to_char(("requestedAt" AT TIME ZONE 'UTC' AT TIME ZONE ${TIMEZONE})::date, 'YYYY-MM-DD') AS day,
               COUNT(*) FILTER (WHERE status = 'COMPLETED')::int AS completed,
               COUNT(*) FILTER (WHERE status = 'CANCELLED')::int AS cancelled
        FROM "Ride"
        WHERE "requestedAt" >= (now() AT TIME ZONE 'UTC') - interval '14 days'
        GROUP BY 1
        ORDER BY 1
    `;

    const cancellations = await prisma.$queryRaw<{ reason: string; count: number }[]>`
        SELECT CASE
                 WHEN "cancelReason" = 'No drivers available' THEN 'No driver found'
                 WHEN "cancelledBy" = 'RIDER' THEN 'Rider cancelled'
                 WHEN "cancelledBy" = 'DRIVER' THEN 'Driver cancelled'
                 WHEN "cancelledBy" = 'ADMIN' THEN 'Cancelled by admin'
                 ELSE 'Other'
               END AS reason,
               COUNT(*)::int AS count
        FROM "Ride"
        WHERE status = 'CANCELLED'
          AND "requestedAt" >= (now() AT TIME ZONE 'UTC') - interval '30 days'
        GROUP BY 1
        ORDER BY 2 DESC
    `;

    const [activeRides, onlineDrivers, pendingDrivers, riders, drivers] = await Promise.all([
        prisma.ride.count({ where: { status: { in: ACTIVE_STATUSES } } }),
        prisma.driverProfile.count({
            where: {
                isOnline: true,
                status: "APPROVED",
                lastSeenAt: { gte: new Date(Date.now() - 5 * 60 * 1000) },
            },
        }),
        prisma.driverProfile.count({ where: { status: "PENDING" } }),
        prisma.user.count({ where: { role: "RIDER" } }),
        prisma.user.count({ where: { role: "DRIVER" } }),
    ]);

    // One entry per trip, most recently changed first.
    const recentTrips = await prisma.ride.findMany({
        orderBy: { updatedAt: "desc" },
        take: 10,
        include: rideInclude,
    });

    return {
        today,
        timings: {
            acceptSeconds: timings.accept_s,
            pickupSeconds: timings.pickup_s,
            tripSeconds: timings.trip_s,
            completionRate: timings.finished ? timings.completed / timings.finished : null,
        },
        daily: fillDays(dailyRows, 14),
        cancellations,
        live: { activeRides, onlineDrivers, pendingDrivers, riders, drivers },
        recentTrips,
    };
}

export type Overview = Awaited<ReturnType<typeof getOverview>>;

/** Adds zero rows for days with no rides so the chart has no gaps. */
function fillDays(rows: DailyRides[], days: number): DailyRides[] {
    const byDay = new Map(rows.map((r) => [r.day, r]));
    const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE }); // YYYY-MM-DD
    return Array.from({ length: days }, (_, i) => {
        const day = fmt.format(new Date(Date.now() - (days - 1 - i) * 86_400_000));
        return byDay.get(day) ?? { day, completed: 0, cancelled: 0 };
    });
}
