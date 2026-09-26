import { ArrowLeft, Check, CarFront, Clock, User } from "lucide-react";
import { carListData, CarData } from "@/utils/CarListData";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { twMerge } from "tailwind-merge";
import { useRouter } from "next/navigation";
import Button from "@/components/Button";
import { useRideHistory } from "@/hooks/useRideHistory";

interface CarOptionsProps {
    distance: number;
    duration: number;
    pickupName: string;
    dropoffName: string;
}

type Step = "select" | "review" | "searching" | "confirmed";

const formatNaira = (amount: number) =>
    `₦${Math.round(amount).toLocaleString()}`;

export default function CarOptions({
    distance,
    duration,
    pickupName,
    dropoffName,
}: CarOptionsProps) {
    const [selectedCar, setSelectedCar] = useState<CarData | null>(null);
    const [step, setStep] = useState<Step>("select");
    const { addRide } = useRideHistory();
    const router = useRouter();

    // Convert meters to kilometers
    const distanceInKm = distance / 1000;
    const durationInMin = Math.max(1, Math.round(duration / 60));

    // Calculate fare with base fare + per-km rate
    const calculateFare = (car: CarData): number => {
        return car.baseFare + car.amountPerKm * distanceInKm;
    };

    const confirmOrder = (): void => {
        if (!selectedCar) return;
        setStep("searching");
        addRide({
            pickup: pickupName,
            dropoff: dropoffName,
            carName: selectedCar.name,
            fare: Math.round(calculateFare(selectedCar)),
            distanceKm: Number(distanceInKm.toFixed(2)),
            durationMin: durationInMin,
        });
        // Simulated driver matching until a real dispatch backend exists
        setTimeout(() => setStep("confirmed"), 1800);
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
                            <h3 className="text-xl font-medium">
                                Choose a ride
                            </h3>
                            <p className="text-sm text-white/50">
                                {distanceInKm.toFixed(1)} km · {durationInMin}{" "}
                                min
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
                                                    isSelected &&
                                                        "bg-lime-400 text-neutral-950",
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
                                                <p className="text-sm text-white/50">
                                                    {car.desc}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p
                                                className={twMerge(
                                                    "font-medium text-lg",
                                                    isSelected &&
                                                        "text-lime-400",
                                                )}
                                            >
                                                {formatNaira(calculateFare(car))}
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
                                ? `Request ${selectedCar.name} · ${formatNaira(calculateFare(selectedCar))}`
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
                        >
                            <ArrowLeft size={16} /> Back to rides
                        </button>

                        <div className="mt-4 rounded-2xl border border-white/10 bg-neutral-950 p-5">
                            <div className="flex flex-col gap-4">
                                <TripPoint label="Pickup" value={pickupName} />
                                <TripPoint
                                    label="Dropoff"
                                    value={dropoffName}
                                    accent="pink"
                                />
                            </div>

                            <div className="mt-5 pt-5 border-t border-white/10 flex flex-col gap-2 text-sm">
                                <Row label="Vehicle" value={selectedCar.name} />
                                <Row
                                    label="Distance"
                                    value={`${distanceInKm.toFixed(2)} km`}
                                />
                                <Row
                                    label="Est. trip time"
                                    value={`${durationInMin} min`}
                                />
                                <Row
                                    label="Base fare"
                                    value={formatNaira(selectedCar.baseFare)}
                                />
                            </div>

                            <div className="mt-5 pt-5 border-t border-white/10 flex justify-between items-baseline">
                                <span className="text-white/50">Total</span>
                                <span className="text-3xl font-medium text-lime-400">
                                    {formatNaira(calculateFare(selectedCar))}
                                </span>
                            </div>
                        </div>

                        <Button
                            variant="primary"
                            className="w-full mt-6"
                            onClick={confirmOrder}
                        >
                            Confirm Order
                        </Button>
                    </motion.div>
                )}

                {step === "searching" && (
                    <motion.div
                        key="searching"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="flex flex-col items-center text-center py-10"
                    >
                        <div className="relative size-20">
                            <span className="absolute inset-0 rounded-full bg-lime-400/30 animate-ping" />
                            <span className="relative size-20 rounded-full bg-lime-400 text-neutral-950 inline-flex items-center justify-center">
                                <CarFront size={32} />
                            </span>
                        </div>
                        <p className="text-xl font-medium mt-6">
                            Finding your driver...
                        </p>
                        <p className="text-white/50 mt-1 text-sm">
                            Matching you with the nearest {selectedCar?.name}
                        </p>
                    </motion.div>
                )}

                {step === "confirmed" && selectedCar && (
                    <motion.div
                        key="confirmed"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center text-center py-8"
                    >
                        <motion.span
                            initial={{ scale: 0, rotate: -45 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: "spring", damping: 12 }}
                            className="size-20 rounded-full bg-lime-400 text-neutral-950 inline-flex items-center justify-center"
                        >
                            <Check size={36} strokeWidth={3} />
                        </motion.span>
                        <p className="text-2xl font-medium mt-6">
                            You&apos;re all set!
                        </p>
                        <p className="text-white/50 mt-2 max-w-xs">
                            Your {selectedCar.name} is on the way to{" "}
                            <span className="text-white">{pickupName}</span>
                        </p>
                        <div className="inline-flex items-center gap-2 mt-4 py-1 px-3 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full text-neutral-950 font-semibold text-sm">
                            <Clock size={14} /> Arriving in ~
                            {Math.min(10, 2 + Math.round(durationInMin / 5))}{" "}
                            min
                        </div>
                        <div className="flex gap-3 mt-8 w-full">
                            <Button
                                variant="secondary"
                                className="flex-1"
                                onClick={() => router.push("/dashboard/rides")}
                            >
                                My Rides
                            </Button>
                            <Button
                                variant="primary"
                                className="flex-1"
                                onClick={() => {
                                    setSelectedCar(null);
                                    setStep("select");
                                }}
                            >
                                Book another
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
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

function Row({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between">
            <span className="text-white/50">{label}</span>
            <span className="font-medium">{value}</span>
        </div>
    );
}
