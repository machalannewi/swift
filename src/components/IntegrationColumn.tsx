"use client";

import { type IntegrationsType } from "@/sections/Integrations";
import { Fragment } from "react/jsx-runtime";
import { twMerge } from "tailwind-merge";
import { motion } from "framer-motion";
import { Accessibility, Armchair, CarFront, Crown, Leaf, Van } from "lucide-react";

// Icons are looked up here because the (server) section can't pass components to this client one.
const fleetIcons = {
    economy: CarFront,
    comfort: Armchair,
    premium: Crown,
    xl: Van,
    green: Leaf,
    accessible: Accessibility,
};

export type FleetIcon = keyof typeof fleetIcons;

export default function IntegrationColumn(props: {
    integrations: IntegrationsType;
    className?: string;
    reverse?: boolean;
}) {
    const { integrations, className, reverse } = props;
    return (
        <motion.div
            initial={{
                y: reverse ? "-50%" : 0,
            }}
            animate={{
                y: reverse ? 0 : "-50%",
            }}
            transition={{
                duration: 15,
                repeat: Infinity,
                ease: "linear",
            }}
            className={twMerge("flex flex-col gap-4 pb-4", className)}
        >
            {Array.from({ length: 2 }).map((_, i) => {
                return (
                    <Fragment key={i}>
                        {integrations.map((integration) => {
                            const Icon = fleetIcons[integration.icon];
                            return (
                                <div
                                    key={integration.name}
                                    className="bg-neutral-900 border border-white/10 rounded-3xl p-6 group"
                                >
                                    <div className="flex justify-center">
                                        {/* Layered lime tile, echoing the Swift logo */}
                                        <div className="relative size-24" aria-hidden>
                                            <span className="absolute inset-0 translate-x-2 translate-y-2 rounded-3xl bg-lime-400/50 transition duration-500 group-hover:translate-x-3 group-hover:translate-y-3" />
                                            <span className="relative size-24 rounded-3xl bg-lime-400 text-neutral-950 inline-flex items-center justify-center transition duration-500 group-hover:-rotate-6">
                                                <Icon size={44} strokeWidth={2.25} />
                                            </span>
                                        </div>
                                    </div>
                                    <h3 className="text-3xl text-center mt-6">
                                        {integration.name}
                                    </h3>
                                    <p className="text-center text-white/50 mt-2">
                                        {integration.description}
                                    </p>
                                </div>
                            );
                        })}
                    </Fragment>
                );
            })}
        </motion.div>
    );
}
