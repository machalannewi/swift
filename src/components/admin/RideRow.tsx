import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import TripProgress from "./TripProgress";
import AdminActionButton from "./AdminActionButton";
import { timeAgo } from "./ui";
import { formatNaira, getCar } from "@/utils/CarListData";
import type { RideWithPeople } from "@/lib/rides";

const ACTIVE = ["REQUESTED", "ACCEPTED", "ARRIVED", "IN_PROGRESS"];

/** One trip: progress, route, who's involved, fare and (if unfinished) a cancel action. */
export default function RideRow({
    ride,
    stuck,
    hideDriver,
}: {
    ride: RideWithPeople;
    stuck?: string | null;
    hideDriver?: boolean;
}) {
    const profile = ride.driver?.driverProfile;
    return (
        <li className="p-5 md:px-6 flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="lg:w-60 flex-shrink-0">
                <TripProgress ride={ride} />
                <p className="text-xs text-white/40 mt-1.5">
                    {timeAgo(ride.requestedAt)} · <span className="font-mono">#{ride.id.slice(-6)}</span>
                </p>
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

            <div className={`grid gap-4 text-sm flex-shrink-0 ${hideDriver ? "lg:w-40" : "grid-cols-2 lg:w-80"}`}>
                <div className="min-w-0">
                    <p className="text-xs text-white/40">Rider</p>
                    <Link
                        href={`/admin/riders?q=${encodeURIComponent(ride.rider.name ?? "")}`}
                        className="block truncate hover:text-lime-400 transition"
                    >
                        {ride.rider.name ?? "Unknown"}
                    </Link>
                </div>
                {!hideDriver && (
                    <div className="min-w-0">
                        <p className="text-xs text-white/40">Driver</p>
                        {ride.driver ? (
                            <Link
                                href={`/admin/drivers/${ride.driver.id}`}
                                className="block truncate hover:text-lime-400 transition"
                            >
                                {ride.driver.name ?? "Unknown"}
                            </Link>
                        ) : (
                            <p className="text-white/40">Not assigned</p>
                        )}
                        {profile && <p className="text-xs text-white/40 truncate">{profile.plateNumber}</p>}
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between lg:justify-end gap-4 lg:w-56 flex-shrink-0">
                <div className="text-right">
                    <p
                        className={`font-medium tabular-nums ${ride.status === "CANCELLED" ? "text-white/40 line-through" : ""}`}
                    >
                        {formatNaira(ride.fare)}
                    </p>
                    <p className="text-xs text-white/40">
                        {getCar(ride.carTier)?.name} · {(ride.distanceMeters / 1000).toFixed(1)} km
                    </p>
                </div>
                {ACTIVE.includes(ride.status) && (
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
}
