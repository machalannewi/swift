"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { twMerge } from "tailwind-merge";
import { dashboardLinks } from "./navLinks";

export default function BottomNavigation() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-4 left-4 right-4 z-30 lg:hidden">
            <div className="mx-auto max-w-md flex justify-around items-center p-2 border border-white/15 bg-neutral-950/80 backdrop-blur rounded-full">
                {dashboardLinks.map((nav) => {
                    const isActive = pathname === nav.href;
                    const Icon = nav.icon;

                    return (
                        <Link
                            key={nav.href}
                            href={nav.href}
                            className={twMerge(
                                "relative flex flex-col items-center gap-0.5 px-4 py-2 rounded-full transition-colors",
                                isActive
                                    ? "text-neutral-950"
                                    : "text-white/50 hover:text-white",
                            )}
                        >
                            {isActive && (
                                <motion.span
                                    layoutId="bottom-nav-active"
                                    className="absolute inset-0 rounded-full bg-lime-400"
                                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                />
                            )}
                            <Icon size={20} className="relative" />
                            <span className="relative text-xs font-medium">
                                {nav.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
