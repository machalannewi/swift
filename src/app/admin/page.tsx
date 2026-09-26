import Link from "next/link";
import { AdminHeader, Card, StatTile, StatusPill, formatDuration, timeAgo } from "@/components/admin/ui";
import RidesChart from "@/components/admin/RidesChart";
import AdminLiveMap from "@/components/admin/AdminLiveMap";
import { getOverview } from "@/lib/analytics";
import { formatNaira } from "@/utils/CarListData";

export const dynamic = "force-dynamic";

const eventVerb: Record<string, string> = {
    REQUESTED: "requested a ride",
    ACCEPTED: "accepted a ride",
    ARRIVED: "arrived at pickup",
    IN_PROGRESS: "started a trip",
    COMPLETED: "completed a trip",
    CANCELLED: "cancelled a ride",
};

export default async function AdminOverviewPage() {
    const o = await getOverview();
    const totalCancelled = o.cancellations.reduce((s, c) => s + c.count, 0);

    return (
        <div className="container max-w-7xl">
            <AdminHeader tag="Admin" title="Platform" accent="overview" />

            {/* Right now */}
            <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatTile label="Active rides" value={String(o.live.activeRides)} href="/admin/rides" />
                <StatTile label="Drivers online" value={String(o.live.onlineDrivers)} hint={`of ${o.live.drivers} drivers`} />
                <StatTile
                    label="Pending approvals"
                    value={String(o.live.pendingDrivers)}
                    href="/admin/drivers?status=PENDING"
                    highlight={o.live.pendingDrivers > 0}
                />
                <StatTile label="Riders" value={String(o.live.riders)} href="/admin/riders" />
            </div>

            {/* Today */}
            <h2 className="text-2xl font-medium mt-10">Today</h2>
            <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatTile label="Rides requested" value={String(o.today.requested)} />
                <StatTile label="Completed" value={String(o.today.completed)} />
                <StatTile label="Cancelled" value={String(o.today.cancelled)} />
                <StatTile label="Gross fares" value={formatNaira(o.today.revenue)} hint="Completed trips" />
            </div>

            <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card title="Rides per day · last 14 days" className="lg:col-span-2">
                    <RidesChart data={o.daily} />
                </Card>

                <Card title="Service · last 7 days">
                    <dl className="flex flex-col gap-4">
                        {[
                            ["Time to accept", formatDuration(o.timings.acceptSeconds), "Request → driver accepts"],
                            ["Pickup time", formatDuration(o.timings.pickupSeconds), "Accept → driver arrives"],
                            ["Trip time", formatDuration(o.timings.tripSeconds), "Start → drop-off"],
                            [
                                "Completion rate",
                                o.timings.completionRate == null ? "-" : `${Math.round(o.timings.completionRate * 100)}%`,
                                "Completed ÷ finished rides",
                            ],
                        ].map(([label, value, hint]) => (
                            <div key={label} className="flex items-baseline justify-between gap-4">
                                <dt>
                                    <p>{label}</p>
                                    <p className="text-xs text-white/40">{hint}</p>
                                </dt>
                                <dd className="text-2xl font-medium tabular-nums">{value}</dd>
                            </div>
                        ))}
                    </dl>
                </Card>
            </div>

            <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card title="Drivers online now" className="lg:col-span-2">
                    <AdminLiveMap />
                </Card>

                <Card title="Cancellations · last 30 days">
                    {totalCancelled === 0 ? (
                        <p className="text-white/50">No cancellations.</p>
                    ) : (
                        <ul className="flex flex-col gap-4">
                            {o.cancellations.map((c) => (
                                <li key={c.reason}>
                                    <div className="flex justify-between text-sm">
                                        <span>{c.reason}</span>
                                        <span className="tabular-nums text-white/70">
                                            {c.count} · {Math.round((c.count / totalCancelled) * 100)}%
                                        </span>
                                    </div>
                                    <div className="mt-2 h-1.5 rounded-full bg-white/10">
                                        <div
                                            className="h-full rounded-full bg-pink-500"
                                            style={{ width: `${(c.count / totalCancelled) * 100}%` }}
                                        />
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>
            </div>

            <Card
                title="Recent activity"
                className="mt-6"
                action={
                    <Link href="/admin/rides?view=all" className="text-sm text-white/50 hover:text-lime-400 transition">
                        All rides →
                    </Link>
                }
            >
                {o.recentEvents.length === 0 ? (
                    <p className="text-white/50">No ride activity yet.</p>
                ) : (
                    <ul className="divide-y divide-white/5">
                        {o.recentEvents.map((e) => (
                            <li key={e.id} className="py-3 flex items-center gap-4">
                                <StatusPill status={e.status} className="w-24 justify-center" />
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm">
                                        <span className="font-medium">
                                            {e.reason === "timeout"
                                                ? "System"
                                                : (e.actorName ?? e.actorRole?.toLowerCase() ?? "Someone")}
                                        </span>{" "}
                                        <span className="text-white/60">
                                            {e.reason === "timeout" ? "expired an unanswered request" : eventVerb[e.status]}
                                        </span>
                                    </p>
                                    <p className="text-xs text-white/40 truncate">
                                        {e.pickup} → {e.dropoff}
                                    </p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <p className="text-sm tabular-nums">{formatNaira(e.fare)}</p>
                                    <p className="text-xs text-white/40">{timeAgo(e.createdAt)}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </Card>
        </div>
    );
}
