"use client";
import { useUser } from "@clerk/nextjs";
import LogoutButton from "@/components/LogoutButton";
import Image from "next/image";
import logoImage from "@/assets/images/logo.svg";
import { X } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { twMerge } from "tailwind-merge";
import { dashboardLinks } from "./navLinks";

export default function Navbar() {
    const { user, isLoaded } = useUser();
    const pathname = usePathname();
    const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

    return (
        <>
            <section className="py-4 lg:py-6 sticky top-0 z-40">
                <div className="container max-w-7xl">
                    <div className="border border-white/15 bg-neutral-950/70 backdrop-blur rounded-full">
                        <div className="grid grid-cols-2 lg:grid-cols-3 p-2 px-4 md:pr-2 items-center">
                            <Link href="/dashboard">
                                <Image
                                    src={logoImage}
                                    alt="Swift logo"
                                    className="h-9 md:h-auto w-auto"
                                />
                            </Link>

                            <nav className="hidden lg:flex justify-center gap-6 font-medium">
                                {dashboardLinks.map((link) => {
                                    const isActive = pathname === link.href;
                                    return (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            className={twMerge(
                                                "relative transition-colors hover:text-lime-400",
                                                isActive && "text-lime-400",
                                            )}
                                        >
                                            {link.label}
                                            {isActive && (
                                                <motion.span
                                                    layoutId="navbar-active"
                                                    className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full bg-lime-400"
                                                />
                                            )}
                                        </Link>
                                    );
                                })}
                            </nav>

                            <div className="flex justify-end items-center">
                                {isLoaded && user ? (
                                    <button
                                        onClick={() => setIsMenuOpen(true)}
                                        aria-label="Open menu"
                                        className="flex items-center gap-3 rounded-full border border-white/15 p-1 md:pl-4 hover:border-lime-400 transition duration-300"
                                    >
                                        <span className="hidden md:inline font-medium">
                                            {user.firstName || user.username}
                                        </span>
                                        <Image
                                            src={user.imageUrl}
                                            alt="Profile"
                                            width={40}
                                            height={40}
                                            className="rounded-full size-8 md:size-10"
                                        />
                                    </button>
                                ) : (
                                    <div className="size-10 rounded-full bg-neutral-800 animate-pulse" />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <AnimatePresence>
                {isMenuOpen && user && (
                    <>
                        <motion.div
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMenuOpen(false)}
                        />

                        <motion.aside
                            className="fixed top-0 right-0 h-full w-[85%] max-w-sm bg-neutral-900 border-l border-white/10 z-50 p-6 flex flex-col"
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 30, stiffness: 300 }}
                        >
                            <button
                                onClick={() => setIsMenuOpen(false)}
                                className="self-end p-2 rounded-full border border-white/15 hover:border-lime-400 hover:text-lime-400 transition"
                                aria-label="Close menu"
                            >
                                <X size={20} />
                            </button>

                            <div className="flex items-center gap-4 mt-6 pb-6 border-b border-white/10">
                                <Image
                                    src={user.imageUrl}
                                    alt="Profile"
                                    width={60}
                                    height={60}
                                    className="rounded-full border-4 border-lime-400"
                                />
                                <div className="min-w-0">
                                    <p className="text-xl font-medium truncate">
                                        {user.fullName || user.username}
                                    </p>
                                    <p className="text-white/50 text-sm truncate">
                                        {user.primaryEmailAddress?.emailAddress}
                                    </p>
                                </div>
                            </div>

                            <nav className="flex flex-col gap-2 flex-1 mt-6">
                                {dashboardLinks.map((item, i) => {
                                    const Icon = item.icon;
                                    const isActive = pathname === item.href;
                                    return (
                                        <motion.div
                                            key={item.href}
                                            initial={{ opacity: 0, x: 24 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.1 + i * 0.05 }}
                                        >
                                            <Link
                                                href={item.href}
                                                onClick={() => setIsMenuOpen(false)}
                                                className={twMerge(
                                                    "flex items-center gap-4 text-lg font-medium px-4 py-3 rounded-2xl border border-transparent hover:border-white/10 hover:bg-neutral-800 transition group",
                                                    isActive &&
                                                        "border-white/10 bg-neutral-800 text-lime-400",
                                                )}
                                            >
                                                <span className="bg-lime-400 text-neutral-950 size-8 rounded-full inline-flex items-center justify-center group-hover:rotate-12 transition duration-500">
                                                    <Icon size={16} />
                                                </span>
                                                {item.label}
                                            </Link>
                                        </motion.div>
                                    );
                                })}
                            </nav>

                            <div className="pt-6 border-t border-white/10">
                                <LogoutButton className="w-full" />
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
