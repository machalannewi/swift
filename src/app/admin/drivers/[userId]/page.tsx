import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Phone } from "lucide-react";
import { Card, StatTile, StatusPill, formatDuration, timeAgo } from "@/components/admin/ui";
import LiveRefresh from "@/components/admin/LiveRefresh";
import AdminActionButton from "@/components/admin/AdminActionButton";
import RideRow from "@/components/admin/RideRow";
import { DRIVER_ACTIONS } from "@/components/admin/driverActions";
import { prisma } from "@/lib/prisma";
import { ACTIVE_STATUSES, rideInclude } from "@/lib/rides";
import { stuckReason } from "@/lib/admin-rides";
import { formatNaira, getCar } from "@/utils/CarListData";

export const dynamic = "force-dynamic";

export default async function AdminDriverPage({ params }: { params: Promise<{ userId: string }> }) {
    const { userId } = await params;
    const driver = await prisma.user.findUnique({
        where: { id: userId },
        include: { driverProfile: true },
    });
    const profile = driver?.driverProfile;
    if (!driver || !profile) notFound();

    const weekAgo = new Date(Date.now() - 7 * 86_400_000);
    const [current, recent, completed, week, cancelledByDriver, accepted, [timing]] = await Promise.all([
        prisma.ride.findFirst({
            where: { driverId: userId, status: { in: ACTIVE_STATUSES } },
            include: rideInclude,
        }),
        prisma.ride.findMany({
            where: { driverId: userId, status: { notIn: ACTIVE_STATUSES } },
            include: rideInclude,
            orderBy: { requestedAt: "desc" },
            take: 15,
        }),
        prisma.ride.aggregate({
            where: { driverId: userId, status: "COMPLETED" },
            _count: true,
            _sum: { fare: true, distanceMeters: true },
        }),
        prisma.ride.aggregate({
            where: { driverId: userId, status: "COMPLETED", completedAt: { gte: weekAgo } },
            _count: true,
            _sum: { fare: true },
        }),
        prisma.ride.count({ where: { driverId: userId, status: "CANCELLED", cancelledBy: "DRIVER" } }),
        prisma.ride.count({ where: { driverId: userId } }),
        prisma.$queryRaw<{ pickup_s: number | null }[]>`
            SELECT AVG(EXTRACT(EPOCH FROM ("arrivedAt" - "acceptedAt")))::float AS pickup_s
            FROM "Ride" WHERE "driverId" = ${userId} AND "arrivedAt" IS NOT NULL
        `,
    ]);

    const status = driver.suspendedAt ? "SUSPENDED" : profile.status;
    const cancelRate = accepted ? Math.round((cancelledByDriver / accepted) * 100) : 0;

    return (
        <div className="container max-w-7xl">
            <div className="mt-4 lg:mt-8 flex items-center justify-between gap-4">
                <Link
                    href="/admin/drivers"
                    className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-lime-400 transition"
                >
                    <ArrowLeft size={16} /> All drivers
                </Link>
                <LiveRefresh />
            </div>

            <Card className="mt-4">
                <div className="flex flex-col md:flex-row md:items-center gap-5">
                    {driver.imageUrl ? (
                        <Image
                            src={driver.imageUrl}
                            alt=""
                            width={80}
                            height={80}
                            className="rounded-full size-20 object-cover border-4 border-lime-400"
                        />
                    ) : (
                        <span className="size-20 rounded-full bg-neutral-800" />
                    )}
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3 flex-wrap">
                            <h1 className="text-3xl md:text-4xl font-medium">{driver.name ?? "Unnamed driver"}</h1>
                            <StatusPill status={status} />
                            {profile.isOnline && status === "APPROVED" && (
                                <span className="inline-flex items-center gap-1.5 text-sm text-lime-400">
                                    <span className="size-2 rounded-full bg-lime-400" /> Online
                                    {profile.lastSeenAt && (
                                        <span className="text-white/40">· seen {timeAgo(profile.lastSeenAt)}</span>
                                    )}
                                </span>
                            )}
                        </div>
                        <p className="text-white/50 mt-1">
                            {driver.email} ·{" "}
                            <a href={`tel:${profile.phone}`} className="inline-flex items-center gap-1 hover:text-lime-400 transition">
                                <Phone size={12} /> {profile.phone}
                            </a>
                        </p>
                        <p className="text-sm mt-2">
                            {profile.vehicleColor} {profile.vehicleMake} {profile.vehicleModel} ·{" "}
                            <span className="rounded bg-white text-neutral-950 px-1.5 text-xs font-bold tracking-wider">
                                {profile.plateNumber}
                            </span>{" "}
                            · {getCar(profile.carTier)?.name} · Licence{" "}
                            <span className="font-mono">{profile.licenseNumber}</span> · Joined {timeAgo(profile.createdAt)}
                        </p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                        {DRIVER_ACTIONS[profile.status].map((a) => (
                            <AdminActionButton
                                key={a.to}
                                url={`/api/admin/drivers/${userId}/status`}
                                body={{ status: a.to }}
                                label={a.label}
                                variant={a.variant}
                                confirmText={a.confirm}
                            />
                        ))}
                    </div>
                </div>
            </Card>

            <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatTile
                    label="Trips completed"
                    value={String(completed._count)}
                    hint={`${((completed._sum.distanceMeters ?? 0) / 1000).toFixed(0)} km driven`}
                />
                <StatTile
                    label="Earned"
                    value={formatNaira(completed._sum.fare ?? 0)}
                    hint={`${formatNaira(week._sum.fare ?? 0)} in the last 7 days`}
                />
                <StatTile label="Avg. pickup time" value={formatDuration(timing?.pickup_s ?? null)} hint="Accept → arrive" />
                <StatTile
                    label="Driver cancellations"
                    value={String(cancelledByDriver)}
                    hint={`${cancelRate}% of accepted trips`}
                    highlight={cancelRate >= 20 && accepted >= 5}
                />
            </div>

            <Card title="Current trip" className="mt-6 p-0 md:p-0 overflow-hidden [&>div]:px-5 [&>div]:pt-5 md:[&>div]:px-6">
                {current ? (
                    <ul>
                        <RideRow ride={current} stuck={stuckReason(current)} hideDriver />
                    </ul>
                ) : (
                    <p className="px-5 md:px-6 pb-5 text-white/50">
                        {profile.isOnline ? "Online and waiting for requests." : "Not on a trip."}
                    </p>
                )}
            </Card>

            <Card
                title="Recent trips"
                className="mt-6 p-0 md:p-0 overflow-hidden [&>div]:px-5 [&>div]:pt-5 md:[&>div]:px-6"
                action={
                    <Link
                        href={`/admin/rides?view=all&driver=${userId}`}
                        className="text-sm text-white/50 hover:text-lime-400 transition"
                    >
                        Search all trips →
                    </Link>
                }
            >
                {recent.length === 0 ? (
                    <p className="px-5 md:px-6 pb-5 text-white/50">No finished trips yet.</p>
                ) : (
                    <ul className="divide-y divide-white/5">
                        {recent.map((ride) => (
                            <RideRow key={ride.id} ride={ride} hideDriver />
                        ))}
                    </ul>
                )}
            </Card>
        </div>
    );
}
