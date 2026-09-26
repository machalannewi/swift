import { ArrowLeft, CarFront, User } from "lucide-react";
import { carListData, CarData, calculateFare, formatNaira } from "@/utils/CarListData";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { twMerge } from "tailwind-merge";
import Button from "@/components/Button";
import { Spinner } from "@/components/ui/spinner";
import { MapboxFeature } from "@/types/mapbox";
import { RideDTO } from "@/types/ride";
import { api } from "@/lib/api-client";

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

    const distanceInKm = distance / 1000;
    const durationInMin = Math.max(1, Math.round(duration / 60));

    const requestRide = async (): Promise<void> => {
        if (!selectedCar) return;
        setIsRequesting(true);
        setError("");
        try {
            const { ride } = await api<{ ride: RideDTO }>("/api/rides", {
                body: {
                    carTier: selectedCar.tier,
                    pickup: toPlace(pickup),
                    dropoff: toPlace(dropoff),
                },
            });
            onRequested(ride);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not request a ride");
            setIsRequesting(false);
        }
    };

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
                            {carListData.map((car, index) => {
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
                                            <p
                                                className={twMerge(
                                                    "font-medium text-lg",
                                                    isSelected && "text-lime-400",
                                                )}
                                            >
                                                {formatNaira(calculateFare(car, distance))}
                                            </p>
                                            <p className="text-xs text-white/40">
                                                ₦{car.amountPerKm}/km
                                            </p>
                                        </div>
                                    </motion.button>
                                );
                            })}
                        </div>

                        <Button
                            variant="primary"
                            className="w-full mt-6"
                            disabled={!selectedCar}
                            onClick={() => setStep("review")}
                        >
                            {selectedCar
                                ? `Continue with ${selectedCar.name} · ${formatNaira(calculateFare(selectedCar, distance))}`
                                : "Select a ride"}
                        </Button>
                    </motion.div>
                )}

                {step === "review" && selectedCar && (
                    <motion.div
                        key="review"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                    >
                        <button
                            type="button"
                            className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-lime-400 transition"
                            onClick={() => setStep("select")}
                            disabled={isRequesting}
                        >
                            <ArrowLeft size={16} /> Back to rides
                        </button>

                        <div className="mt-4 rounded-2xl border border-white/10 bg-neutral-950 p-5">
                            <TripSummary pickup={pickup.place_name} dropoff={dropoff.place_name} />

                            <div className="mt-5 pt-5 border-t border-white/10 flex flex-col gap-2 text-sm">
                                <Row label="Vehicle" value={selectedCar.name} />
                                <Row label="Distance" value={`${distanceInKm.toFixed(2)} km`} />
                                <Row label="Est. trip time" value={`${durationInMin} min`} />
                                <Row label="Base fare" value={formatNaira(selectedCar.baseFare)} />
                            </div>

                            <div className="mt-5 pt-5 border-t border-white/10 flex justify-between items-baseline">
                                <span className="text-white/50">Total</span>
                                <span className="text-3xl font-medium text-lime-400">
                                    {formatNaira(calculateFare(selectedCar, distance))}
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
                            {isRequesting ? <Spinner /> : `Request ${selectedCar.name}`}
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
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
