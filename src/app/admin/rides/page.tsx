import Link from "next/link";
import { AlertTriangle, Search, X } from "lucide-react";
import { AdminHeader, Card, FilterTabs } from "@/components/admin/ui";
import RideRow from "@/components/admin/RideRow";
import { prisma } from "@/lib/prisma";
import { ACTIVE_STATUSES, expireStaleRequests, rideInclude } from "@/lib/rides";
import { PERIODS, STATUS_FILTERS, rideSearchWhere, stuckReason } from "@/lib/admin-rides";

export const dynamic = "force-dynamic";

const LIMIT = 100;

type Params = { view?: string; status?: string; period?: string; q?: string; driver?: string };

export default async function AdminRidesPage({ searchParams }: { searchParams: Promise<Params> }) {
    const params = await searchParams;
    const q = params.q?.trim() ?? "";
    // Searching or filtering by driver always looks through history.
    const view = q || params.driver ? "all" : (params.view ?? "active");
    const status = params.status ?? "all";
    const period = params.period ?? "all";

    const href = (overrides: Partial<Params>) => {
        const next = { view, status, period, q, driver: params.driver, ...overrides };
        const sp = new URLSearchParams();
        if (next.view && next.view !== "active") sp.set("view", next.view);
        if (next.status && next.status !== "all") sp.set("status", next.status);
        if (next.period && next.period !== "all") sp.set("period", next.period);
        if (next.q) sp.set("q", next.q);
        if (next.driver) sp.set("driver", next.driver);
        const s = sp.toString();
        return s ? `/admin/rides?${s}` : "/admin/rides";
    };

    await expireStaleRequests();

    const [activeCount, filterDriver] = await Promise.all([
        prisma.ride.count({ where: { status: { in: ACTIVE_STATUSES } } }),
        params.driver
            ? prisma.user.findUnique({ where: { id: params.driver }, select: { id: true, name: true } })
            : null,
    ]);

    const rides =
        view === "active"
            ? await prisma.ride.findMany({
                  where: { status: { in: ACTIVE_STATUSES } },
                  include: rideInclude,
                  orderBy: { requestedAt: "asc" },
              })
            : await prisma.ride.findMany({
                  where: rideSearchWhere({ q, status, period, driverId: params.driver }),
                  include: rideInclude,
                  orderBy: { requestedAt: "desc" },
                  take: LIMIT,
              });

    const stuckCount = view === "active" ? rides.filter(stuckReason).length : 0;

    return (
        <div className="container max-w-7xl">
            <AdminHeader tag="Operations" title="Ride" accent="control">
                <form action="/admin/rides" className="flex items-center gap-2 h-12 w-full md:w-96 rounded-full border border-white/15 bg-neutral-900 px-4 focus-within:border-lime-400 transition">
                    <Search size={16} className="text-white/40 flex-shrink-0" />
                    <input
                        name="q"
                        defaultValue={q}
                        placeholder="Rider, driver, plate, place or ride ID"
                        className="bg-transparent outline-none w-full placeholder:text-white/30"
                    />
                    {status !== "all" && <input type="hidden" name="status" value={status} />}
                    {period !== "all" && <input type="hidden" name="period" value={period} />}
                    {params.driver && <input type="hidden" name="driver" value={params.driver} />}
                </form>
            </AdminHeader>

            <div className="mt-8 flex flex-col gap-3">
                <FilterTabs
                    active={view}
                    tabs={[
                        { key: "active", label: "In progress", href: "/admin/rides", count: activeCount },
                        { key: "all", label: "History", href: href({ view: "all" }) },
                    ]}
                />
                {view === "all" && (
                    <div className="flex flex-col lg:flex-row gap-3">
                        <FilterTabs
                            active={status}
                            tabs={STATUS_FILTERS.map((f) => ({ key: f.key, label: f.label, href: href({ status: f.key }) }))}
                        />
                        <span className="hidden lg:block w-px bg-white/10" />
                        <FilterTabs
                            active={period}
                            tabs={PERIODS.map((p) => ({ key: p.key, label: p.label, href: href({ period: p.key }) }))}
                        />
                    </div>
                )}
                {(q || filterDriver) && (
                    <div className="flex flex-wrap gap-2">
                        {q && (
                            <Link
                                href={href({ q: "" })}
                                className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 h-8 text-sm hover:bg-white/15 transition"
                            >
                                Search: “{q}” <X size={14} />
                            </Link>
                        )}
                        {filterDriver && (
                            <Link
                                href={href({ driver: "" })}
                                className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 h-8 text-sm hover:bg-white/15 transition"
                            >
                                Driver: {filterDriver.name ?? "Unknown"} <X size={14} />
                            </Link>
                        )}
                    </div>
                )}
            </div>

            {stuckCount > 0 && (
                <div className="mt-6 flex items-center gap-3 rounded-2xl border border-pink-400/40 bg-pink-400/10 px-5 py-3 text-sm">
                    <AlertTriangle size={18} className="text-pink-400 flex-shrink-0" />
                    {stuckCount} {stuckCount === 1 ? "trip looks" : "trips look"} stuck. Check with the driver, or cancel it.
                </div>
            )}

            <Card className="mt-6 p-0 md:p-0 overflow-hidden">
                {rides.length === 0 ? (
                    <p className="p-8 text-center text-white/50">
                        {view === "active"
                            ? "No rides in progress right now."
                            : q
                              ? `No rides match “${q}”.`
                              : "No rides match these filters."}
                    </p>
                ) : (
                    <ul className="divide-y divide-white/5">
                        {rides.map((ride) => (
                            <RideRow key={ride.id} ride={ride} stuck={view === "active" ? stuckReason(ride) : null} />
                        ))}
                    </ul>
                )}
            </Card>
            {rides.length === LIMIT && (
                <p className="mt-3 text-sm text-white/40 text-center">
                    Showing the latest {LIMIT} rides. Narrow the search or filters to find older trips.
                </p>
            )}
        </div>
    );
}
