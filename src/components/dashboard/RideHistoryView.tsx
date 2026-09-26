"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { twMerge } from "tailwind-merge";
import { CarFront, Clock, Route } from "lucide-react";
import Tag from "@/components/Tag";
import { formatNaira, getCar } from "@/utils/CarListData";
import type { RideDTO } from "@/types/ride";

interface RideHistoryViewProps {
    tag: string;
    title: string;
    accent: string;
    stats: { label: string; value: string }[];
    rides: RideDTO[];
    perspective: "rider" | "driver";
    empty: { title: string; body: string; cta?: { label: string; href: string } };
}

const formatDate = (iso: string) =>
    new Date(iso).toLocaleString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });

const statusStyles: Record<string, string> = {
    COMPLETED: "bg-lime-400 text-neutral-950",
    CANCELLED: "bg-neutral-800 text-white/60",
};

export default function RideHistoryView({
    tag,
    title,
    accent,
    stats,
    rides,
    perspective,
    empty,
}: RideHistoryViewProps) {
    return (
        <div className="container max-w-5xl">
            <div className="mt-4 lg:mt-8">
                <Tag>{tag}</Tag>
                <h1 className="text-4xl md:text-6xl font-medium mt-4">
                    {title} <span className="text-lime-400">{accent}</span>
                </h1>
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
                {rides.length === 0 && (
                    <div className="bg-neutral-900 border border-white/10 rounded-3xl p-10 text-center">
                        <span className="bg-lime-400 text-neutral-950 size-14 rounded-full inline-flex items-center justify-center">
                            <CarFront size={28} />
                        </span>
                        <h2 className="text-3xl font-medium mt-6">{empty.title}</h2>
                        <p className="text-white/50 mt-2">{empty.body}</p>
                        {empty.cta && (
                            <Link
                                href={empty.cta.href}
                                className="mt-6 inline-flex h-12 items-center rounded-full bg-lime-400 px-6 font-medium text-neutral-950 hover:bg-lime-300 transition duration-300"
                            >
                                {empty.cta.label}
                            </Link>
                        )}
                    </div>
                )}

                {rides.map((ride, i) => {
                    const other = perspective === "rider" ? ride.driver?.name : ride.rider.name;
                    return (
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
                                            {formatDate(ride.requestedAt)} ·{" "}
                                            {getCar(ride.carTier)?.name ?? ride.carTier}
                                            {other ? ` · ${other}` : ""}
                                        </p>
                                        <p className="font-medium truncate mt-1">
                                            <span className="text-lime-400">●</span>{" "}
                                            {ride.pickup.name}
                                        </p>
                                        <p className="font-medium truncate">
                                            <span className="text-pink-400">●</span>{" "}
                                            {ride.dropoff.name}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex md:flex-col items-center md:items-end justify-between gap-2 flex-shrink-0">
                                    <div className="flex items-center gap-3">
                                        <span
                                            className={twMerge(
                                                "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                                                statusStyles[ride.status] ??
                                                    "bg-gradient-to-r from-purple-400 to-pink-400 text-neutral-950",
                                            )}
                                        >
                                            {ride.status.replace("_", " ").toLowerCase()}
                                        </span>
                                        <p
                                            className={twMerge(
                                                "text-2xl font-medium",
                                                ride.status === "CANCELLED" && "text-white/40 line-through",
                                            )}
                                        >
                                            {formatNaira(ride.fare)}
                                        </p>
                                    </div>
                                    <div className="flex gap-3 text-sm text-white/50">
                                        <span className="inline-flex items-center gap-1">
                                            <Route size={14} />
                                            {(ride.distanceMeters / 1000).toFixed(1)} km
                                        </span>
                                        <span className="inline-flex items-center gap-1">
                                            <Clock size={14} />
                                            {Math.max(1, Math.round(ride.durationSeconds / 60))} min
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
