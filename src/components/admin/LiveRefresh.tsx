"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { twMerge } from "tailwind-merge";
import { useChannelEvent } from "@/hooks/useChannelEvent";
import { getPusher } from "@/lib/pusher-client";
import { channels, events } from "@/lib/realtime";

/**
 * Re-renders the current admin page (server data) whenever a ride or driver
 * changes anywhere on the platform. Bursts of events are batched.
 */
export default function LiveRefresh() {
    const router = useRouter();
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [state, setState] = useState<string>("connecting");

    const scheduleRefresh = () => {
        if (timer.current) return;
        timer.current = setTimeout(() => {
            timer.current = null;
            router.refresh();
        }, 1200);
    };

    useChannelEvent(channels.admin, events.rideUpdated, scheduleRefresh);
    useChannelEvent(channels.admin, events.driverUpdated, scheduleRefresh);

    useEffect(() => {
        const pusher = getPusher();
        if (!pusher) {
            setState("unavailable");
            return;
        }
        const update = () => setState(pusher.connection.state);
        update();
        pusher.connection.bind("state_change", update);
        return () => {
            pusher.connection.unbind("state_change", update);
        };
    }, []);

    const live = state === "connected";
    return (
        <span
            className={twMerge(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium",
                live ? "border-lime-400/40 text-lime-400" : "border-white/15 text-white/50",
            )}
            title={`Real-time connection: ${state}`}
        >
            <span className="relative flex size-2">
                {live && (
                    <span className="absolute inset-0 rounded-full bg-lime-400 animate-ping" />
                )}
                <span
                    className={twMerge(
                        "relative size-2 rounded-full",
                        live ? "bg-lime-400" : "bg-white/40",
                    )}
                />
            </span>
            {live ? "Live" : state === "unavailable" ? "Offline" : "Connecting"}
        </span>
    );
}
