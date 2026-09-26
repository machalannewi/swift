"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { twMerge } from "tailwind-merge";
import { Check, Navigation, Power, Route, X } from "lucide-react";
import Mapbox from "@/components/dashboard/Mapbox";
import Tag from "@/components/Tag";
import Button from "@/components/Button";
import { Spinner } from "@/components/ui/spinner";
import { TripSummary, Row } from "@/components/dashboard/CarOptions";
import { useMapboxRoute } from "@/hooks/useMapboxRoute";
import { useLiveRide } from "@/hooks/useLiveRide";
import { useChannelEvent } from "@/hooks/useChannelEvent";
import { getPosition, useDriverLocation } from "@/hooks/useDriverLocation";
import { channels, events } from "@/lib/realtime";
import { api } from "@/lib/api-client";
import { placeToFeature } from "@/utils/mapbox";
import { formatNaira, getCar } from "@/utils/CarListData";
import type { RideDTO } from "@/types/ride";

// Matches REQUEST_TIMEOUT_MS on the server.
const OFFER_TTL_MS = 3 * 60 * 1000;

interface DriverHomeProps {
    userId: string;
    firstName: string | null;
    carTier: string;
    initialOnline: boolean;
}

function kmBetween(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
    const toRad = (d: number) => (d * Math.PI) / 180;
    const h =
        Math.sin(toRad(b.lat - a.lat) / 2) ** 2 +
        Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(toRad(b.lng - a.lng) / 2) ** 2;
    return 6371 * 2 * Math.asin(Math.sqrt(h));
}

const directionsUrl = (p: { lat: number; lng: number }) =>
    `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`;

export default function DriverHome({ userId, firstName, carTier, initialOnline }: DriverHomeProps) {
    const [online, setOnline] = useState(false);
    const [isToggling, setIsToggling] = useState(false);
    const [offers, setOffers] = useState<RideDTO[]>([]);
    const [acceptingId, setAcceptingId] = useState<string | null>(null);
    const [error, setError] = useState("");
    const { ride, setRide, isLoading, isActive } = useLiveRide();

    const position = useDriverLocation(online, isActive);

    const loadOpenRequests = useCallback(async () => {
        const { rides } = await api<{ rides: RideDTO[] }>("/api/driver/requests");
        setOffers(rides);
    }, []);

    const goOnline = useCallback(async () => {
        setIsToggling(true);
        setError("");
        try {
            const location = await getPosition();
            await api("/api/driver/status", { body: { online: true, location } });
            setOnline(true);
            await loadOpenRequests();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not go online");
        } finally {
            setIsToggling(false);
        }
    }, [loadOpenRequests]);

    const goOffline = async () => {
        setIsToggling(true);
        setError("");
        try {
            await api("/api/driver/status", { body: { online: false } });
            setOnline(false);
            setOffers([]);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not go offline");
        } finally {
            setIsToggling(false);
        }
    };

    // Resume where the driver left off (e.g. after a page refresh).
    useEffect(() => {
        if (isLoading) return;
        if (initialOnline || isActive) goOnline();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoading]);

    // New requests pushed by the server, and requests other drivers took.
    useChannelEvent<RideDTO>(online ? channels.user(userId) : null, events.rideOffered, (offer) =>
        setOffers((prev) => (prev.some((o) => o.id === offer.id) ? prev : [...prev, offer])),
    );
    useChannelEvent<{ rideId: string }>(
        online ? channels.driverTier(carTier) : null,
        events.rideUnavailable,
        ({ rideId }) => setOffers((prev) => prev.filter((o) => o.id !== rideId)),
    );

    // Drop requests the server will have expired.
    useEffect(() => {
        const timer = setInterval(() => {
            setOffers((prev) =>
                prev.filter((o) => Date.now() - new Date(o.requestedAt).getTime() < OFFER_TTL_MS),
            );
        }, 10_000);
        return () => clearInterval(timer);
    }, []);

    const accept = async (offer: RideDTO) => {
        setAcceptingId(offer.id);
        setError("");
        try {
            const { ride: accepted } = await api<{ ride: RideDTO }>(
                `/api/rides/${offer.id}/accept`,
                { body: {} },
            );
            setRide(accepted);
            setOffers([]);
        } catch (err) {
            setOffers((prev) => prev.filter((o) => o.id !== offer.id));
            setError(err instanceof Error ? err.message : "Could not accept this ride");
        } finally {
            setAcceptingId(null);
        }
    };

    // Map: the active trip if there is one, otherwise just the driver.
    const tripPickup = useMemo(() => (ride ? placeToFeature(ride.pickup) : null), [ride?.id]);
    const tripDropoff = useMemo(() => (ride ? placeToFeature(ride.dropoff) : null), [ride?.id]);
    const { route } = useMapboxRoute(tripPickup, tripDropoff);

    return (
        <div className="container max-w-7xl">
            <div className="mt-4 lg:mt-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                    <Tag>{firstName ? `Hi, ${firstName}` : "Driver"}</Tag>
                    <h1 className="text-4xl md:text-6xl font-medium mt-4">
                        You&apos;re{" "}
                        <span className={online ? "text-lime-400" : "text-white/40"}>
                            {online ? "online" : "offline"}
                        </span>
                    </h1>
                </div>
                <OnlineToggle
                    online={online}
                    loading={isToggling}
                    disabled={isActive}
                    onToggle={online ? goOffline : goOnline}
                />
            </div>

            {error && (
                <p className="mt-4 text-sm text-red-400" role="alert">
                    {error}
                </p>
            )}

            <div className="mt-8 grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6 items-start">
                <div className="h-[40vh] lg:h-[calc(100vh-260px)] lg:min-h-[520px] lg:sticky lg:top-28 rounded-3xl overflow-hidden border border-white/10 bg-neutral-900">
                    <Mapbox
                        pickup={tripPickup}
                        dropoff={tripDropoff}
                        route={route}
                        driverLocation={position}
                    />
                </div>

                {isLoading ? (
                    <div className="h-80 rounded-3xl bg-neutral-900 border border-white/10 animate-pulse" />
                ) : ride ? (
                    <DriverTripPanel ride={ride} onChange={setRide} onDone={() => setRide(null)} />
                ) : (
                    <RequestList
                        online={online}
                        offers={offers}
                        position={position}
                        acceptingId={acceptingId}
                        onAccept={accept}
                    />
                )}
            </div>
        </div>
    );
}

function OnlineToggle({
    online,
    loading,
    disabled,
    onToggle,
}: {
    online: boolean;
    loading: boolean;
    disabled: boolean;
    onToggle: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onToggle}
            disabled={loading || disabled}
            className={twMerge(
                "self-start md:self-auto inline-flex items-center gap-3 h-14 rounded-full border pl-2 pr-6 font-medium transition duration-300 disabled:opacity-50",
                online
                    ? "border-lime-400 bg-lime-400/10 text-lime-400"
                    : "border-white/15 hover:border-white/40",
            )}
        >
            <span
                className={twMerge(
                    "size-10 rounded-full inline-flex items-center justify-center transition duration-300",
                    online ? "bg-lime-400 text-neutral-950" : "bg-neutral-800",
                )}
            >
                {loading ? <Spinner /> : <Power size={18} />}
            </span>
            {online ? "Go offline" : "Go online"}
        </button>
    );
}

function RequestList({
    online,
    offers,
    position,
    acceptingId,
    onAccept,
}: {
    online: boolean;
    offers: RideDTO[];
    position: { lat: number; lng: number } | null;
    acceptingId: string | null;
    onAccept: (offer: RideDTO) => void;
}) {
    return (
        <section className="bg-neutral-900 border border-white/10 rounded-3xl p-6">
            <h2 className="text-3xl font-medium">Ride requests</h2>
            <p className="text-white/50 mt-1">
                {online
                    ? "New requests near you appear here instantly."
                    : "Go online to start receiving requests."}
            </p>

            <div className="mt-6 flex flex-col gap-3">
                <AnimatePresence initial={false}>
                    {offers.map((offer) => (
                        <motion.div
                            key={offer.id}
                            layout
                            initial={{ opacity: 0, y: 20, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 40 }}
                            className="rounded-2xl border border-lime-400/40 bg-neutral-950 p-5"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-3xl font-medium text-lime-400">
                                        {formatNaira(offer.fare)}
                                    </p>
                                    <p className="text-sm text-white/50 mt-1">
                                        {(offer.distanceMeters / 1000).toFixed(1)} km trip
                                        {position &&
                                            ` · ${kmBetween(position, offer.pickup).toFixed(1)} km away`}
                                    </p>
                                </div>
                                {offer.rider.imageUrl && (
                                    <Image
                                        src={offer.rider.imageUrl}
                                        alt={offer.rider.name ?? "Rider"}
                                        width={44}
                                        height={44}
                                        className="rounded-full size-11 object-cover"
                                    />
                                )}
                            </div>
                            <div className="mt-4">
                                <TripSummary pickup={offer.pickup.name} dropoff={offer.dropoff.name} />
                            </div>
                            <Button
                                variant="primary"
                                className="w-full mt-5"
                                onClick={() => onAccept(offer)}
                                disabled={acceptingId !== null}
                            >
                                {acceptingId === offer.id ? <Spinner /> : "Accept ride"}
                            </Button>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {offers.length === 0 && (
                    <div className="flex flex-col items-center text-center py-10">
                        <div className="relative size-16">
                            {online && (
                                <span className="absolute inset-0 rounded-full bg-lime-400/30 animate-ping" />
                            )}
                            <span
                                className={twMerge(
                                    "relative size-16 rounded-full inline-flex items-center justify-center",
                                    online ? "bg-lime-400 text-neutral-950" : "bg-neutral-800 text-white/50",
                                )}
                            >
                                <Route size={26} />
                            </span>
                        </div>
                        <p className="mt-5 font-medium">
                            {online ? "Waiting for requests..." : "You're offline"}
                        </p>
                    </div>
                )}
            </div>
        </section>
    );
}

const nextStep = {
    ACCEPTED: { to: "ARRIVED", label: "I've arrived", headline: "Head to pickup" },
    ARRIVED: { to: "IN_PROGRESS", label: "Start trip", headline: "Waiting for rider" },
    IN_PROGRESS: { to: "COMPLETED", label: "Complete trip", headline: "Drive to destination" },
} as const;

function DriverTripPanel({
    ride,
    onChange,
    onDone,
}: {
    ride: RideDTO;
    onChange: (ride: RideDTO) => void;
    onDone: () => void;
}) {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const step = nextStep[ride.status as keyof typeof nextStep];

    const run = async (url: string, body: object, confirmText?: string) => {
        if (confirmText && !confirm(confirmText)) return;
        setBusy(true);
        setError("");
        try {
            const { ride: updated } = await api<{ ride: RideDTO }>(url, { body });
            onChange(updated);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setBusy(false);
        }
    };

    if (ride.status === "COMPLETED" || ride.status === "CANCELLED") {
        const done = ride.status === "COMPLETED";
        return (
            <section className="bg-neutral-900 border border-white/10 rounded-3xl p-6 flex flex-col items-center text-center">
                <motion.span
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", damping: 12 }}
                    className={twMerge(
                        "size-20 rounded-full inline-flex items-center justify-center mt-4",
                        done ? "bg-lime-400 text-neutral-950" : "bg-neutral-800",
                    )}
                >
                    {done ? <Check size={36} strokeWidth={3} /> : <X size={36} strokeWidth={3} />}
                </motion.span>
                <p className="text-2xl font-medium mt-6">
                    {done ? "Trip complete" : "Trip cancelled"}
                </p>
                <p className="text-white/50 mt-2">
                    {done
                        ? `Collect ${formatNaira(ride.fare)} from your rider.`
                        : (ride.cancelReason ?? "This trip was cancelled.")}
                </p>
                <Button variant="primary" className="w-full mt-8" onClick={onDone}>
                    Back to requests
                </Button>
            </section>
        );
    }

    const target = ride.status === "IN_PROGRESS" ? ride.dropoff : ride.pickup;

    return (
        <section className="bg-neutral-900 border border-white/10 rounded-3xl p-6">
            <div className="inline-flex py-1 px-3 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full text-neutral-950 font-semibold text-sm">
                {getCar(ride.carTier)?.name ?? "Trip"} · {formatNaira(ride.fare)}
            </div>
            <h2 className="text-3xl font-medium mt-4">{step?.headline}</h2>

            <div className="mt-6 flex items-center gap-4 rounded-2xl bg-neutral-950 border border-white/10 p-4">
                {ride.rider.imageUrl ? (
                    <Image
                        src={ride.rider.imageUrl}
                        alt={ride.rider.name ?? "Rider"}
                        width={48}
                        height={48}
                        className="rounded-full size-12 object-cover border-2 border-lime-400"
                    />
                ) : (
                    <span className="size-12 rounded-full bg-neutral-800" />
                )}
                <div className="min-w-0 flex-1">
                    <p className="text-xs uppercase text-white/40">Rider</p>
                    <p className="font-medium truncate">{ride.rider.name ?? "Swift rider"}</p>
                </div>
                <a
                    href={directionsUrl(target)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 h-10 rounded-full border border-white/15 px-4 text-sm font-medium hover:border-lime-400 hover:text-lime-400 transition"
                >
                    <Navigation size={16} /> Navigate
                </a>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-neutral-950 p-5">
                <TripSummary pickup={ride.pickup.name} dropoff={ride.dropoff.name} />
                <div className="mt-5 pt-5 border-t border-white/10 flex flex-col gap-2 text-sm">
                    <Row label="Distance" value={`${(ride.distanceMeters / 1000).toFixed(1)} km`} />
                    <Row label="Est. time" value={`${Math.max(1, Math.round(ride.durationSeconds / 60))} min`} />
                </div>
            </div>

            {error && (
                <p className="mt-4 text-sm text-red-400" role="alert">
                    {error}
                </p>
            )}

            {step && (
                <Button
                    variant="primary"
                    className="w-full mt-6"
                    disabled={busy}
                    onClick={() =>
                        run(
                            `/api/rides/${ride.id}/status`,
                            { status: step.to },
                            step.to === "COMPLETED" ? "Complete this trip?" : undefined,
                        )
                    }
                >
                    {busy ? <Spinner /> : step.label}
                </Button>
            )}

            {ride.status !== "IN_PROGRESS" && (
                <Button
                    variant="secondary"
                    className="w-full mt-3 border-white/15"
                    disabled={busy}
                    onClick={() => run(`/api/rides/${ride.id}/cancel`, {}, "Cancel this trip?")}
                >
                    Cancel trip
                </Button>
            )}
        </section>
    );
}
