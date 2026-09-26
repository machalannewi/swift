"use client";

import Tag from "@/components/Tag";
import Button from "@/components/Button";
import { useRideHistory } from "@/hooks/useRideHistory";
import { CarFront, Clock, Route } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

const formatNaira = (amount: number) => `₦${Math.round(amount).toLocaleString()}`;

const formatDate = (iso: string) =>
    new Date(iso).toLocaleString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });

export default function RidesPage() {
    const router = useRouter();
    const { rides, isLoaded, clearRides } = useRideHistory();

    const totalSpent = rides.reduce((sum, ride) => sum + ride.fare, 0);
    const totalKm = rides.reduce((sum, ride) => sum + ride.distanceKm, 0);

    const stats = [
        { label: "Rides taken", value: rides.length.toString() },
        { label: "Total spent", value: formatNaira(totalSpent) },
        { label: "Distance travelled", value: `${totalKm.toFixed(1)} km` },
    ];

    return (
        <div className="container max-w-5xl">
            <div className="mt-4 lg:mt-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                    <Tag>Ride History</Tag>
                    <h1 className="text-4xl md:text-6xl font-medium mt-4">
                        Your <span className="text-lime-400">journeys</span>
                    </h1>
                </div>
                {rides.length > 0 && (
                    <Button
                        variant="secondary"
                        size="sm"
                        className="self-start md:self-auto"
                        onClick={() => {
                            if (confirm("Clear all ride history?")) clearRides();
                        }}
                    >
                        Clear history
                    </Button>
                )}
            </div>

            <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
                {stats.map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-neutral-900 border border-white/10 rounded-3xl p-6 hover:scale-[1.02] transition duration-500"
                    >
                        <p className="text-white/50">{stat.label}</p>
                        <p className="text-4xl font-medium mt-2">{stat.value}</p>
                    </motion.div>
                ))}
            </div>

            <div className="mt-10 flex flex-col gap-4">
                {isLoaded && rides.length === 0 && (
                    <div className="bg-neutral-900 border border-white/10 rounded-3xl p-10 text-center">
                        <span className="bg-lime-400 text-neutral-950 size-14 rounded-full inline-flex items-center justify-center">
                            <CarFront size={28} />
                        </span>
                        <h2 className="text-3xl font-medium mt-6">
                            No rides yet
                        </h2>
                        <p className="text-white/50 mt-2">
                            Your trips will show up here once you book them.
                        </p>
                        <Button
                            variant="primary"
                            className="mt-6"
                            onClick={() => router.push("/dashboard")}
                        >
                            Book your first ride
                        </Button>
                    </div>
                )}

                {rides.map((ride, i) => (
                    <motion.div
                        key={ride.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + Math.min(i, 8) * 0.06 }}
                        className="bg-neutral-900 border border-white/10 rounded-3xl p-6 hover:border-white/20 transition duration-300 group"
                    >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex gap-4 min-w-0">
                                <span className="size-12 rounded-2xl bg-neutral-800 inline-flex items-center justify-center flex-shrink-0 group-hover:bg-lime-400 group-hover:text-neutral-950 transition duration-500">
                                    <CarFront size={24} />
                                </span>
                                <div className="min-w-0">
                                    <p className="text-sm text-white/50">
                                        {formatDate(ride.createdAt)} ·{" "}
                                        {ride.carName}
                                    </p>
                                    <p className="font-medium truncate mt-1">
                                        <span className="text-lime-400">●</span>{" "}
                                        {ride.pickup}
                                    </p>
                                    <p className="font-medium truncate">
                                        <span className="text-pink-400">●</span>{" "}
                                        {ride.dropoff}
                                    </p>
                                </div>
                            </div>
                            <div className="flex md:flex-col items-center md:items-end justify-between gap-2 flex-shrink-0">
                                <p className="text-2xl font-medium">
                                    {formatNaira(ride.fare)}
                                </p>
                                <div className="flex gap-3 text-sm text-white/50">
                                    <span className="inline-flex items-center gap-1">
                                        <Route size={14} />
                                        {ride.distanceKm.toFixed(1)} km
                                    </span>
                                    <span className="inline-flex items-center gap-1">
                                        <Clock size={14} />
                                        {ride.durationMin} min
                                    </span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
