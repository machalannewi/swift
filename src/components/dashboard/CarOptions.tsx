import { ArrowLeft, CarFront, User, Zap } from "lucide-react";
import { carListData, CarData, formatNaira } from "@/utils/CarListData";
import { calculateFare, isSurging, type FareBreakdown } from "@/utils/pricing";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { twMerge } from "tailwind-merge";
import Button from "@/components/Button";
import { Spinner } from "@/components/ui/spinner";
import { MapboxFeature } from "@/types/mapbox";
import { RideDTO } from "@/types/ride";
import { api } from "@/lib/api-client";
import { usePricing } from "@/hooks/usePricing";

interface CarOptionsProps {
    distance: number;
    duration: number;
    pickup: MapboxFeature;
    dropoff: MapboxFeature;
    onRequested: (ride: RideDTO) => void;
}

type Step = "select" | "review";

const toPlace = (f: MapboxFeature) => ({
    name: f.place_name,
    lat: f.center[1],
    lng: f.center[0],
});

export default function CarOptions({
    distance,
    duration,
    pickup,
    dropoff,
    onRequested,
}: CarOptionsProps) {
    const [selectedCar, setSelectedCar] = useState<CarData | null>(null);
    const [step, setStep] = useState<Step>("select");
    const [isRequesting, setIsRequesting] = useState(false);
    const [error, setError] = useState("");
    const { pricing, forTier, reload, error: pricingError } = usePricing();

    const distanceInKm = distance / 1000;
    const durationInMin = Math.max(1, Math.round(duration / 60));

    // Only tiers with live pricing can be booked.
    const cars = carListData
        .map((car) => {
            const p = forTier(car.tier);
            return p ? { car, pricing: p, quote: calculateFare(p, distance, duration) } : null;
        })
        .filter((c) => c !== null);

    const selected = cars.find((c) => c.car.id === selectedCar?.id) ?? null;

    const requestRide = async (): Promise<void> => {
        if (!selected) return;
        setIsRequesting(true);
        setError("");
        try {
            const { ride } = await api<{ ride: RideDTO }>("/api/rides", {
                body: {
                    carTier: selected.car.tier,
                    pickup: toPlace(pickup),
                    dropoff: toPlace(dropoff),
                    expectedSurge: selected.pricing.surgeMultiplier,
                },
            });
            onRequested(ride);
        } catch (err) {
            // Prices may have changed since the quote - show the new ones.
            await reload();
            setError(err instanceof Error ? err.message : "Could not request a ride");
            setIsRequesting(false);
        }
    };

    if (!pricing) {
        return (
            <div className="mt-6 flex flex-col gap-3">
                {pricingError ? (
                    <p className="text-sm text-red-400">{pricingError}</p>
                ) : (
                    Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-20 rounded-2xl bg-neutral-800 animate-pulse" />
                    ))
                )}
            </div>
        );
    }

    return (
        <div className="mt-6">
            <AnimatePresence mode="wait">
                {step === "select" && (
                    <motion.div
                        key="select"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                    >
                        <div className="flex items-baseline justify-between">
                            <h3 className="text-xl font-medium">Choose a ride</h3>
                            <p className="text-sm text-white/50">
                                {distanceInKm.toFixed(1)} km · {durationInMin} min
                            </p>
                        </div>

                        <div className="mt-4 flex flex-col gap-3">
                            {cars.map(({ car, pricing: p, quote }, index) => {
                                const isSelected = selectedCar?.id === car.id;
                                return (
                                    <motion.button
                                        type="button"
                                        key={car.id}
                                        initial={{ opacity: 0, y: 16 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.08 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => setSelectedCar(car)}
                                        className={twMerge(
                                            "w-full text-left flex items-center justify-between gap-4 p-4 rounded-2xl border border-white/10 bg-neutral-950 hover:border-white/30 transition duration-300 group",
                                            isSelected &&
                                                "border-lime-400 hover:border-lime-400 outline outline-2 outline-offset-2 outline-lime-400/30",
                                        )}
                                    >
                                        <div className="flex items-center gap-4">
                                            <span
                                                className={twMerge(
                                                    "size-12 rounded-2xl inline-flex items-center justify-center bg-neutral-800 transition duration-300 group-hover:-rotate-6",
                                                    isSelected && "bg-lime-400 text-neutral-950",
                                                )}
                                            >
                                                <CarFront size={24} />
                                            </span>
                                            <div>
                                                <p className="font-medium flex gap-3 items-center">
                                                    {car.name}
                                                    <span className="flex gap-1 items-center text-sm text-white/50">
                                                        <User size={14} />
                                                        {car.seat}
                                                    </span>
                                                </p>
                                                <p className="text-sm text-white/50">{car.desc}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={twMerge("font-medium text-lg", isSelected && "text-lime-400")}>
                                                {formatNaira(quote.total)}
                                            </p>
                                            {isSurging(p) ? (
                                                <SurgeBadge multiplier={p.surgeMultiplier} />
                                            ) : (
                                                <p className="text-xs text-white/40">Upfront price</p>
                                            )}
                                        </div>
                                    </motion.button>
                                );
                            })}
                        </div>

                        {selected && isSurging(selected.pricing) && (
                            <p className="mt-4 text-sm text-white/60 flex items-start gap-2">
                                <Zap size={16} className="text-pink-400 mt-0.5 flex-shrink-0" />
                                Fares for {selected.car.name} are higher right now
                                {selected.pricing.surgeNote ? ` (${selected.pricing.surgeNote.toLowerCase()})` : ""}{" "}
                                because demand is high.
                            </p>
                        )}

                        <Button
                            variant="primary"
                            className="w-full mt-6"
                            disabled={!selected}
                            onClick={() => setStep("review")}
                        >
                            {selected
                                ? `Continue with ${selected.car.name} · ${formatNaira(selected.quote.total)}`
                                : "Select a ride"}
                        </Button>
                    </motion.div>
                )}

                {step === "review" && selected && (
                    <motion.div
                        key="review"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                    >
                        <button
                            type="button"
                            className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-lime-400 transition"
                            onClick={() => {
                                setError("");
                                setStep("select");
                            }}
                            disabled={isRequesting}
                        >
                            <ArrowLeft size={16} /> Back to rides
                        </button>

                        <div className="mt-4 rounded-2xl border border-white/10 bg-neutral-950 p-5">
                            <TripSummary pickup={pickup.place_name} dropoff={dropoff.place_name} />

                            <div className="mt-5 pt-5 border-t border-white/10 flex flex-col gap-2 text-sm">
                                <Row label="Vehicle" value={selected.car.name} />
                                <FareBreakdownRows
                                    fare={selected.quote}
                                    distanceKm={distanceInKm}
                                    minutes={durationInMin}
                                />
                            </div>

                            <div className="mt-5 pt-5 border-t border-white/10 flex justify-between items-baseline">
                                <span className="text-white/50">Total</span>
                                <span className="text-3xl font-medium text-lime-400">
                                    {formatNaira(selected.quote.total)}
                                </span>
                            </div>
                        </div>

                        {error && (
                            <p className="mt-4 text-sm text-red-400" role="alert">
                                {error}
                            </p>
                        )}

                        <Button
                            variant="primary"
                            className="w-full mt-6"
                            onClick={requestRide}
                            disabled={isRequesting}
                        >
                            {isRequesting ? <Spinner /> : `Request ${selected.car.name}`}
                        </Button>
                        <p className="mt-3 text-xs text-white/40 text-center">
                            This price is locked in when you request.
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export function SurgeBadge({ multiplier }: { multiplier: number }) {
    return (
        <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 px-2 py-0.5 text-xs font-semibold text-neutral-950">
            <Zap size={11} /> {multiplier.toFixed(1)}×
        </span>
    );
}

/** Line items that add up to the fare. */
export function FareBreakdownRows({
    fare,
    distanceKm,
    minutes,
}: {
    fare: Pick<FareBreakdown, "baseFare" | "distanceFare" | "timeFare" | "bookingFee" | "surgeMultiplier"> &
        Partial<Pick<FareBreakdown, "surgeAmount" | "minimumTopUp">>;
    distanceKm: number;
    minutes: number;
}) {
    const rideFare = fare.baseFare + fare.distanceFare + fare.timeFare;
    const surgeAmount = fare.surgeAmount ?? Math.round(rideFare * fare.surgeMultiplier) - rideFare;
    return (
        <>
            <Row label="Base fare" value={formatNaira(fare.baseFare)} />
            <Row label={`Distance · ${distanceKm.toFixed(1)} km`} value={formatNaira(fare.distanceFare)} />
            {fare.timeFare > 0 && <Row label={`Time · ${minutes} min`} value={formatNaira(fare.timeFare)} />}
            {surgeAmount > 0 && (
                <Row label={`High demand · ${fare.surgeMultiplier.toFixed(1)}×`} value={`+${formatNaira(surgeAmount)}`} />
            )}
            {(fare.minimumTopUp ?? 0) > 0 && (
                <Row label="Minimum fare adjustment" value={`+${formatNaira(fare.minimumTopUp!)}`} />
            )}
            {fare.bookingFee > 0 && <Row label="Booking fee" value={formatNaira(fare.bookingFee)} />}
        </>
    );
}

export function TripSummary({ pickup, dropoff }: { pickup: string; dropoff: string }) {
    return (
        <div className="flex flex-col gap-4">
            <TripPoint label="Pickup" value={pickup} />
            <TripPoint label="Dropoff" value={dropoff} accent="pink" />
        </div>
    );
}

function TripPoint({
    label,
    value,
    accent = "lime",
}: {
    label: string;
    value: string;
    accent?: "lime" | "pink";
}) {
    return (
        <div className="flex gap-3">
            <span
                className={twMerge(
                    "mt-1.5 size-3 rounded-full flex-shrink-0",
                    accent === "lime"
                        ? "bg-lime-400"
                        : "bg-gradient-to-r from-purple-400 to-pink-400",
                )}
            />
            <div className="min-w-0">
                <p className="text-xs uppercase text-white/40">{label}</p>
                <p className="font-medium truncate">{value}</p>
            </div>
        </div>
    );
}

export function Row({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between gap-4">
            <span className="text-white/50">{label}</span>
            <span className="font-medium text-right">{value}</span>
        </div>
    );
}
