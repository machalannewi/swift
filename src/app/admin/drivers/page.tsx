import { Phone } from "lucide-react";
import { AdminHeader, Card, FilterTabs, StatusPill, timeAgo } from "@/components/admin/ui";
import Link from "next/link";
import AdminActionButton from "@/components/admin/AdminActionButton";
import { DRIVER_ACTIONS } from "@/components/admin/driverActions";
import { prisma } from "@/lib/prisma";
import { formatNaira, getCar } from "@/utils/CarListData";
import type { DriverStatus } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

const TABS: { key: DriverStatus; label: string }[] = [
    { key: "PENDING", label: "Pending" },
    { key: "APPROVED", label: "Approved" },
    { key: "SUSPENDED", label: "Suspended" },
    { key: "REJECTED", label: "Rejected" },
];

export default async function AdminDriversPage({
    searchParams,
}: {
    searchParams: Promise<{ status?: string }>;
}) {
    const { status: statusParam } = await searchParams;
    const counts = await prisma.driverProfile.groupBy({ by: ["status"], _count: true });
    const countOf = (s: DriverStatus) => counts.find((c) => c.status === s)?._count ?? 0;

    // Default to the approval queue when there is one.
    const status: DriverStatus =
        (TABS.find((t) => t.key === statusParam)?.key as DriverStatus) ??
        (countOf("PENDING") > 0 ? "PENDING" : "APPROVED");

    const drivers = await prisma.driverProfile.findMany({
        where: { status },
        orderBy: { createdAt: status === "PENDING" ? "asc" : "desc" },
        include: { user: { select: { id: true, name: true, email: true, imageUrl: true } } },
        take: 200,
    });

    const stats = await prisma.ride.groupBy({
        by: ["driverId"],
        where: { driverId: { in: drivers.map((d) => d.userId) }, status: "COMPLETED" },
        _count: true,
        _sum: { fare: true },
    });
    const statsFor = (userId: string) => stats.find((s) => s.driverId === userId);

    return (
        <div className="container max-w-7xl">
            <AdminHeader tag="Drivers" title="Driver" accent="accounts" />

            <div className="mt-8">
                <FilterTabs
                    active={status}
                    tabs={TABS.map((t) => ({
                        key: t.key,
                        label: t.label,
                        href: `/admin/drivers?status=${t.key}`,
                        count: countOf(t.key),
                    }))}
                />
            </div>

            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
                {drivers.length === 0 && (
                    <Card className="lg:col-span-2">
                        <p className="text-center text-white/50 py-6">
                            {status === "PENDING" ? "No applications waiting for review." : "No drivers here."}
                        </p>
                    </Card>
                )}

                {drivers.map((d) => {
                    const s = statsFor(d.userId);
                    return (
                        <Card key={d.id}>
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <Link
                                            href={`/admin/drivers/${d.userId}`}
                                            className="text-lg font-medium truncate hover:text-lime-400 transition"
                                        >
                                            {d.user.name ?? "Unnamed driver"} →
                                        </Link>
                                        <StatusPill status={d.status} />
                                        {d.status === "APPROVED" && d.isOnline && (
                                            <span className="inline-flex items-center gap-1.5 text-xs text-lime-400">
                                                <span className="size-1.5 rounded-full bg-lime-400" /> online
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-white/50 truncate">{d.user.email}</p>
                                </div>
                                <div className="flex gap-2 flex-shrink-0">
                                    {DRIVER_ACTIONS[d.status].map((a) => (
                                        <AdminActionButton
                                            key={a.to}
                                            url={`/api/admin/drivers/${d.userId}/status`}
                                            body={{ status: a.to }}
                                            label={a.label}
                                            variant={a.variant}
                                            confirmText={a.confirm}
                                        />
                                    ))}
                                </div>
                            </div>

                            <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                                <div>
                                    <dt className="text-xs text-white/40">Vehicle</dt>
                                    <dd>
                                        {d.vehicleColor} {d.vehicleMake} {d.vehicleModel}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-xs text-white/40">Plate · Type</dt>
                                    <dd>
                                        <span className="rounded bg-white text-neutral-950 px-1.5 text-xs font-bold tracking-wider">
                                            {d.plateNumber}
                                        </span>{" "}
                                        {getCar(d.carTier)?.name ?? d.carTier}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-xs text-white/40">Licence no.</dt>
                                    <dd className="font-mono">{d.licenseNumber}</dd>
                                </div>
                                <div>
                                    <dt className="text-xs text-white/40">Phone</dt>
                                    <dd>
                                        <a href={`tel:${d.phone}`} className="inline-flex items-center gap-1.5 hover:text-lime-400 transition">
                                            <Phone size={12} /> {d.phone}
                                        </a>
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-xs text-white/40">Trips · Earned</dt>
                                    <dd className="tabular-nums">
                                        {s?._count ?? 0} · {formatNaira(s?._sum.fare ?? 0)}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-xs text-white/40">Applied</dt>
                                    <dd>{timeAgo(d.createdAt)}</dd>
                                </div>
                            </dl>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
