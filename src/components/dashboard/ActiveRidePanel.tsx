"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { CarFront, Check, Phone, X } from "lucide-react";
import Button from "@/components/Button";
import { Spinner } from "@/components/ui/spinner";
import { TripSummary, Row, FareBreakdownRows } from "./CarOptions";
import { api } from "@/lib/api-client";
import { formatNaira, getCar } from "@/utils/CarListData";
import type { RideDTO } from "@/types/ride";

interface ActiveRidePanelProps {
    ride: RideDTO;
    driverLocation: { lat: number; lng: number } | null;
    onChange: (ride: RideDTO) => void;
    onDone: () => void;
}

/** Rough ETA from straight-line distance at city driving speed. */
function etaMinutes(from: { lat: number; lng: number }, to: { lat: number; lng: number }) {
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(to.lat - from.lat);
    const dLng = toRad(to.lng - from.lng);
    const h =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(dLng / 2) ** 2;
    const km = 6371 * 2 * Math.asin(Math.sqrt(h)) * 1.3; // roads aren't straight
    return Math.max(1, Math.round((km / 25) * 60));
}

function useElapsed(since: string) {
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        const t = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(t);
    }, []);
    const s = Math.max(0, Math.floor((now - new Date(since).getTime()) / 1000));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export default function ActiveRidePanel({
    ride,
    driverLocation,
    onChange,
    onDone,
}: ActiveRidePanelProps) {
    const [isCancelling, setIsCancelling] = useState(false);
    const [error, setError] = useState("");
    const carName = getCar(ride.carTier)?.name ?? "Swift";
    const canCancel = ["REQUESTED", "ACCEPTED", "ARRIVED"].includes(ride.status);

    const cancel = async () => {
        if (!confirm("Cancel this ride?")) return;
        setIsCancelling(true);
        setError("");
        try {
            const { ride: updated } = await api<{ ride: RideDTO }>(
                `/api/rides/${ride.id}/cancel`,
                { body: {} },
            );
            onChange(updated);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not cancel");
        } finally {
            setIsCancelling(false);
        }
    };

    return (
        <section className="bg-neutral-900 border border-white/10 rounded-3xl p-6">
            <AnimatePresence mode="wait">
                <motion.div
                    key={ride.status}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.25 }}
                >
                    {ride.status === "REQUESTED" && <Searching ride={ride} carName={carName} />}

                    {(ride.status === "ACCEPTED" ||
                        ride.status === "ARRIVED" ||
                        ride.status === "IN_PROGRESS") && (
                        <OnTrip ride={ride} driverLocation={driverLocation} />
                    )}

                    {ride.status === "COMPLETED" && (
                        <Finished
                            icon={<Check size={36} strokeWidth={3} />}
                            title="You've arrived!"
                            body={`Please pay your driver ${formatNaira(ride.fare)}. Thanks for riding with Swift.`}
                        />
                    )}

                    {ride.status === "CANCELLED" && (
                        <Finished
                            icon={<X size={36} strokeWidth={3} />}
                            title="Ride cancelled"
                            body={ride.cancelReason ?? "This ride was cancelled."}
                            muted
                        />
                    )}
                </motion.div>
            </AnimatePresence>

            <div className="mt-6 rounded-2xl border border-white/10 bg-neutral-950 p-5">
                <TripSummary pickup={ride.pickup.name} dropoff={ride.dropoff.name} />
                <div className="mt-5 pt-5 border-t border-white/10 flex flex-col gap-2 text-sm">
                    <Row label="Vehicle" value={carName} />
                    {ride.fareBreakdown ? (
                        <FareBreakdownRows
                            fare={{
                                ...ride.fareBreakdown,
                                // Whatever the parts don't cover came from the minimum fare.
                                minimumTopUp: Math.max(
                                    0,
                                    ride.fare -
                                        ride.fareBreakdown.bookingFee -
                                        Math.round(
                                            (ride.fareBreakdown.baseFare +
                                                ride.fareBreakdown.distanceFare +
                                                ride.fareBreakdown.timeFare) *
                                                ride.fareBreakdown.surgeMultiplier,
                                        ),
                                ),
                            }}
                            distanceKm={ride.distanceMeters / 1000}
                            minutes={Math.max(1, Math.round(ride.durationSeconds / 60))}
                        />
                    ) : (
                        <Row label="Distance" value={`${(ride.distanceMeters / 1000).toFixed(1)} km`} />
                    )}
                    <div className="flex justify-between gap-4 pt-2 mt-1 border-t border-white/10">
                        <span className="text-white/50">Total</span>
                        <span className="font-medium text-lime-400">{formatNaira(ride.fare)}</span>
                    </div>
                </div>
            </div>

            {error && (
                <p className="mt-4 text-sm text-red-400" role="alert">
                    {error}
                </p>
            )}

            {canCancel && (
                <Button
                    variant="secondary"
                    className="w-full mt-6 border-white/15"
                    onClick={cancel}
                    disabled={isCancelling}
                >
                    {isCancelling ? <Spinner /> : "Cancel ride"}
                </Button>
            )}

            {(ride.status === "COMPLETED" || ride.status === "CANCELLED") && (
                <Button variant="primary" className="w-full mt-6" onClick={onDone}>
                    {ride.status === "COMPLETED" ? "Book another ride" : "Book again"}
                </Button>
            )}
        </section>
    );
}

function Searching({ ride, carName }: { ride: RideDTO; carName: string }) {
    const elapsed = useElapsed(ride.requestedAt);
    return (
        <div className="flex flex-col items-center text-center py-4">
            <div className="relative size-20">
                <span className="absolute inset-0 rounded-full bg-lime-400/30 animate-ping" />
                <span className="relative size-20 rounded-full bg-lime-400 text-neutral-950 inline-flex items-center justify-center">
                    <CarFront size={32} />
                </span>
            </div>
            <p className="text-2xl font-medium mt-6">Finding your driver...</p>
            <p className="text-white/50 mt-1 text-sm">
                Nearby {carName} drivers have been notified · {elapsed}
            </p>
        </div>
    );
}

function OnTrip({
    ride,
    driverLocation,
}: {
    ride: RideDTO;
    driverLocation: { lat: number; lng: number } | null;
}) {
    const driver = ride.driver;
    const headline = {
        ACCEPTED: driverLocation
            ? `Arriving in ~${etaMinutes(driverLocation, ride.pickup)} min`
            : "Your driver is on the way",
        ARRIVED: "Your driver has arrived",
        IN_PROGRESS: "On your way",
    }[ride.status as "ACCEPTED" | "ARRIVED" | "IN_PROGRESS"];

    return (
        <div>
            <div className="inline-flex items-center gap-2 py-1 px-3 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full text-neutral-950 font-semibold text-sm">
                {ride.status === "IN_PROGRESS" ? "Trip in progress" : "Driver assigned"}
            </div>
            <h2 className="text-3xl font-medium mt-4">{headline}</h2>
            {ride.status === "IN_PROGRESS" && (
                <p className="text-white/50 mt-1">Heading to {ride.dropoff.name}</p>
            )}

            {driver && (
                <div className="mt-6 flex items-center gap-4 rounded-2xl bg-neutral-950 border border-white/10 p-4">
                    {driver.imageUrl ? (
                        <Image
                            src={driver.imageUrl}
                            alt={driver.name ?? "Driver"}
                            width={56}
                            height={56}
                            className="rounded-full border-2 border-lime-400 size-14 object-cover"
                        />
                    ) : (
                        <span className="size-14 rounded-full bg-neutral-800" />
                    )}
                    <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{driver.name ?? "Your driver"}</p>
                        <p className="text-sm text-white/50 truncate">{driver.vehicle}</p>
                        <p className="mt-1 inline-flex rounded-lg bg-white text-neutral-950 px-2 py-0.5 text-xs font-bold tracking-wider">
                            {driver.plateNumber}
                        </p>
                    </div>
                    <a
                        href={`tel:${driver.phone}`}
                        className="size-11 rounded-full bg-lime-400 text-neutral-950 inline-flex items-center justify-center hover:bg-lime-300 transition flex-shrink-0"
                        aria-label="Call driver"
                    >
                        <Phone size={18} />
                    </a>
                </div>
            )}
        </div>
    );
}

function Finished({
    icon,
    title,
    body,
    muted,
}: {
    icon: React.ReactNode;
    title: string;
    body: string;
    muted?: boolean;
}) {
    return (
        <div className="flex flex-col items-center text-center py-4">
            <motion.span
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", damping: 12 }}
                className={
                    muted
                        ? "size-20 rounded-full bg-neutral-800 text-white inline-flex items-center justify-center"
                        : "size-20 rounded-full bg-lime-400 text-neutral-950 inline-flex items-center justify-center"
                }
            >
                {icon}
            </motion.span>
            <p className="text-2xl font-medium mt-6">{title}</p>
            <p className="text-white/50 mt-2 max-w-xs">{body}</p>
        </div>
    );
}
