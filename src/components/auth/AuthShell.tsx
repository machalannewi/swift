"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import logoImage from "@/assets/images/logo.svg";
import Pointer from "@/components/Pointer";

const copy = {
    rider: {
        badge: "✨ Available in 10+ cities",
        heading: ["Get there fast,", "travel in ", "comfort"],
        body: "Book a ride in seconds and get to your destination safely, comfortably, and on time.",
        perks: ["Upfront Pricing", "Instant Rides", "Safety Features", "24/7 Support"],
    },
    driver: {
        badge: "🚗 Now onboarding drivers",
        heading: ["Drive on your", "own ", "schedule"],
        body: "Go online whenever you like, get real-time ride requests nearby, and see every fare upfront.",
        perks: ["Flexible Hours", "Real-time Requests", "Upfront Fares", "Trip History"],
    },
};

export default function AuthShell({
    children,
    audience = "rider",
}: Readonly<{
    children: React.ReactNode;
    audience?: "rider" | "driver";
}>) {
    const { badge, heading, body, perks } = copy[audience];
    return (
        <div className="min-h-svh bg-neutral-950 text-white overflow-x-clip">
            <section className="py-4 lg:py-8">
                <div className="container max-w-6xl">
                    <div className="flex items-center justify-between border border-white/15 bg-neutral-950/70 backdrop-blur rounded-full p-2 px-4">
                        <Link href="/">
                            <Image src={logoImage} alt="Swift logo" className="h-9 md:h-auto w-auto" />
                        </Link>
                        <Link
                            href="/"
                            className="text-sm font-medium text-white/70 hover:text-lime-400 transition pr-2"
                        >
                            ← Back to home
                        </Link>
                    </div>
                </div>
            </section>

            <div className="container max-w-6xl py-8 lg:py-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                {/* Brand panel */}
                <motion.div
                    initial={{ opacity: 0, x: -40 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                    className="relative hidden lg:block"
                >
                    <div className="inline-flex py-1 px-3 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full text-neutral-950 font-semibold">
                        {badge}
                    </div>
                    <h2 className="text-6xl xl:text-7xl font-medium mt-6">
                        {heading[0]}
                        <br />
                        {heading[1]}<span className="text-lime-400">{heading[2]}</span>
                    </h2>
                    <p className="text-xl text-white/50 mt-6 max-w-md">
                        {body}
                    </p>
                    <div className="mt-8 flex flex-wrap gap-3 max-w-md">
                        {perks.map((perk, i) => (
                            <motion.div
                                key={perk}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 + i * 0.1 }}
                                className="bg-neutral-900 border border-white/10 inline-flex px-4 py-1.5 rounded-2xl items-center gap-3 hover:scale-105 transition duration-500 group"
                            >
                                <span className="bg-lime-400 text-neutral-950 size-5 rounded-full inline-flex items-center justify-center text-xl group-hover:rotate-45 transition duration-500">
                                    &#10038;
                                </span>
                                <span className="font-medium">{perk}</span>
                            </motion.div>
                        ))}
                    </div>

                    <motion.div
                        className="absolute -top-6 right-8"
                        animate={{ y: [0, -16, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <Pointer name="Rider" color="red" />
                    </motion.div>
                    <motion.div
                        className="absolute bottom-24 right-0"
                        animate={{ y: [0, -16, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.75 }}
                    >
                        <Pointer name="Driver" />
                    </motion.div>
                </motion.div>

                {/* Form */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="w-full max-w-md mx-auto lg:ml-auto lg:mr-0"
                >
                    {children}
                    <p className="text-center text-xs text-white/40 mt-6">
                        By continuing, you agree to our Terms of Service and
                        Privacy Policy.
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
