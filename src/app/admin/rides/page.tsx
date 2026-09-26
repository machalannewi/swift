import { AlertTriangle } from "lucide-react";
import { AdminHeader, Card, FilterTabs, StatusPill, timeAgo } from "@/components/admin/ui";
import AdminActionButton from "@/components/admin/AdminActionButton";
import { prisma } from "@/lib/prisma";
import { ACTIVE_STATUSES, expireStaleRequests, rideInclude } from "@/lib/rides";
import { formatNaira, getCar } from "@/utils/CarListData";
import type { Prisma, RideStatus } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

const HISTORY_FILTERS: { key: string; label: string; where: Prisma.RideWhereInput }[] = [
    { key: "all", label: "All", where: {} },
    { key: "COMPLETED", label: "Completed", where: { status: "COMPLETED" } },
    { key: "CANCELLED", label: "Cancelled", where: { status: "CANCELLED" } },
];

type RideRow = Prisma.RideGetPayload<{ include: typeof rideInclude }>;

/** A trip that has sat in one state far longer than it should. */
function stuckReason(ride: RideRow): string | null {
    const mins = (d: Date | null) => (d ? (Date.now() - d.getTime()) / 60000 : 0);
    if (ride.status === "ACCEPTED" && mins(ride.acceptedAt) > 30)
        return "Driver hasn't arrived after 30+ min";
    if (ride.status === "ARRIVED" && mins(ride.arrivedAt) > 15)
        return "Trip not started 15+ min after arrival";
    if (ride.status === "IN_PROGRESS" && mins(ride.startedAt) > (ride.durationSeconds / 60) * 2 + 20)
        return "Trip running far longer than expected";
    return null;
}

export default async function AdminRidesPage({
    searchParams,
}: {
    searchParams: Promise<{ view?: string; status?: string }>;
}) {
    const { view = "active", status = "all" } = await searchParams;
    await expireStaleRequests();

    const [active, activeCount] = await Promise.all([
        view === "active"
            ? prisma.ride.findMany({
                  where: { status: { in: ACTIVE_STATUSES } },
                  include: rideInclude,
                  orderBy: { requestedAt: "asc" },
              })
            : Promise.resolve([] as RideRow[]),
        prisma.ride.count({ where: { status: { in: ACTIVE_STATUSES } } }),
    ]);

    const filter = HISTORY_FILTERS.find((f) => f.key === status) ?? HISTORY_FILTERS[0];
    const history =
        view === "all"
            ? await prisma.ride.findMany({
                  where: filter.where,
                  include: rideInclude,
                  orderBy: { requestedAt: "desc" },
                  take: 100,
              })
            : [];

    const rides = view === "active" ? active : history;
    const stuckCount = active.filter(stuckReason).length;

    return (
        <div className="container max-w-7xl">
            <AdminHeader tag="Operations" title="Ride" accent="control" />

            <div className="mt-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <FilterTabs
                    active={view}
                    tabs={[
                        { key: "active", label: "In progress", href: "/admin/rides", count: activeCount },
                        { key: "all", label: "History", href: "/admin/rides?view=all" },
                    ]}
                />
                {view === "all" && (
                    <FilterTabs
                        active={filter.key}
                        tabs={HISTORY_FILTERS.map((f) => ({
                            key: f.key,
                            label: f.label,
                            href: `/admin/rides?view=all&status=${f.key}`,
                        }))}
                    />
                )}
            </div>

            {view === "active" && stuckCount > 0 && (
                <div className="mt-6 flex items-center gap-3 rounded-2xl border border-pink-400/40 bg-pink-400/10 px-5 py-3 text-sm">
                    <AlertTriangle size={18} className="text-pink-400 flex-shrink-0" />
                    {stuckCount} {stuckCount === 1 ? "trip looks" : "trips look"} stuck. Check with the
                    driver, or cancel it.
                </div>
            )}

            <Card className="mt-6 p-0 md:p-0 overflow-hidden">
                {rides.length === 0 ? (
                    <p className="p-8 text-center text-white/50">
                        {view === "active" ? "No rides in progress right now." : "No rides match this filter."}
                    </p>
                ) : (
                    <ul className="divide-y divide-white/5">
                        {rides.map((ride) => {
                            const stuck = view === "active" ? stuckReason(ride) : null;
                            const profile = ride.driver?.driverProfile;
                            return (
                                <li
                                    key={ride.id}
                                    className="p-5 md:px-6 flex flex-col lg:flex-row lg:items-center gap-4"
                                >
                                    <div className="flex items-center gap-3 lg:w-44 flex-shrink-0">
                                        <StatusPill status={ride.status} />
                                        <span className="text-xs text-white/40">{timeAgo(ride.requestedAt)}</span>
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm truncate">
                                            <span className="text-lime-400">●</span> {ride.pickupName}
                                        </p>
                                        <p className="text-sm truncate">
                                            <span className="text-pink-400">●</span> {ride.dropoffName}
                                        </p>
                                        {stuck && (
                                            <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-pink-400">
                                                <AlertTriangle size={12} /> {stuck}
                                            </p>
                                        )}
                                        {ride.status === "CANCELLED" && ride.cancelReason && (
                                            <p className="mt-1 text-xs text-white/40">{ride.cancelReason}</p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 text-sm lg:w-80 flex-shrink-0">
                                        <div className="min-w-0">
                                            <p className="text-xs text-white/40">Rider</p>
                                            <p className="truncate">{ride.rider.name ?? "Unknown"}</p>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs text-white/40">Driver</p>
                                            <p className="truncate">
                                                {ride.driver ? (ride.driver.name ?? "Unknown") : "-"}
                                            </p>
                                            {profile && (
                                                <p className="text-xs text-white/40 truncate">{profile.plateNumber}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between lg:justify-end gap-4 lg:w-56 flex-shrink-0">
                                        <div className="text-right">
                                            <p className="font-medium tabular-nums">{formatNaira(ride.fare)}</p>
                                            <p className="text-xs text-white/40">
                                                {getCar(ride.carTier)?.name} · {(ride.distanceMeters / 1000).toFixed(1)} km
                                            </p>
                                        </div>
                                        {(ACTIVE_STATUSES as RideStatus[]).includes(ride.status) && (
                                            <AdminActionButton
                                                url={`/api/admin/rides/${ride.id}/cancel`}
                                                label="Cancel"
                                                variant="danger"
                                                confirmText="Cancel this ride? The rider and driver are notified immediately."
                                            />
                                        )}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </Card>
        </div>
    );
}
