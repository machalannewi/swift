"use client";

import { FormEvent, InputHTMLAttributes, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { twMerge } from "tailwind-merge";
import { CarFront, User } from "lucide-react";
import Button from "@/components/Button";
import { Spinner } from "@/components/ui/spinner";
import { carListData, CarTier } from "@/utils/CarListData";
import { api } from "@/lib/api-client";

export default function DriverOnboardingForm() {
    const router = useRouter();
    const [carTier, setCarTier] = useState<CarTier>("SWIFT_X");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        setIsLoading(true);
        setError("");
        try {
            await api("/api/driver/onboarding", {
                body: { ...Object.fromEntries(form), carTier },
            });
            router.push("/driver");
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-neutral-900 border border-white/10 rounded-3xl p-6 md:p-8 text-white">
            <h1 className="text-3xl md:text-4xl font-medium">
                Your <span className="text-lime-400">vehicle</span>
            </h1>
            <p className="text-white/50 mt-2">
                We review every driver before their first trip.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
                <div>
                    <p className="text-sm font-medium text-white/70 mb-2">Vehicle type</p>
                    <div className="grid grid-cols-3 gap-2">
                        {carListData.map((car) => {
                            const selected = car.tier === carTier;
                            return (
                                <button
                                    key={car.tier}
                                    type="button"
                                    onClick={() => setCarTier(car.tier)}
                                    className={twMerge(
                                        "flex flex-col items-center gap-1 rounded-2xl border border-white/10 bg-neutral-950 p-3 text-sm transition duration-300 hover:border-white/30",
                                        selected && "border-lime-400 hover:border-lime-400 text-lime-400",
                                    )}
                                >
                                    <CarFront size={22} />
                                    <span className="font-medium">{car.name.replace("Swift ", "")}</span>
                                    <span className="flex items-center gap-1 text-xs text-white/50">
                                        <User size={12} /> {car.seat}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Make" name="vehicleMake" placeholder="Toyota" />
                    <Field label="Model" name="vehicleModel" placeholder="Corolla" />
                    <Field label="Colour" name="vehicleColor" placeholder="Silver" />
                    <Field
                        label="Plate number"
                        name="plateNumber"
                        placeholder="LAG-123-AB"
                        className="uppercase"
                    />
                    <Field label="Driver's licence no." name="licenseNumber" placeholder="ABC12345678" />
                    <Field label="Phone" name="phone" type="tel" placeholder="+234 800 000 0000" />
                </div>

                <AnimatePresence>
                    {error && (
                        <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="text-sm text-red-400 overflow-hidden"
                            role="alert"
                        >
                            {error}
                        </motion.p>
                    )}
                </AnimatePresence>

                <Button type="submit" variant="primary" className="w-full mt-2" disabled={isLoading}>
                    {isLoading ? <Spinner /> : "Submit application"}
                </Button>
            </form>
        </div>
    );
}

function Field({
    label,
    name,
    className,
    ...props
}: { label: string; name: string } & InputHTMLAttributes<HTMLInputElement>) {
    return (
        <div className="flex flex-col gap-2">
            <label htmlFor={name} className="text-sm font-medium text-white/70">
                {label}
            </label>
            <input
                id={name}
                name={name}
                required
                className={twMerge(
                    "h-12 w-full rounded-full border border-white/15 bg-neutral-950 px-5 text-white placeholder:text-white/30 outline-none transition duration-300 focus:border-lime-400",
                    className,
                )}
                {...props}
            />
        </div>
    );
}
