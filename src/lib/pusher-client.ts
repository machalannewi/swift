"use client";

import Pusher, { type Channel } from "pusher-js";

let client: Pusher | null = null;

export function getPusher(): Pusher | null {
    if (typeof window === "undefined") return null;
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    if (!key) {
        console.warn("NEXT_PUBLIC_PUSHER_KEY is not set - real-time updates are disabled");
        return null;
    }
    client ??= new Pusher(key, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER ?? "eu",
        channelAuthorization: { endpoint: "/api/pusher/auth", transport: "ajax" },
    });
    return client;
}

// Several components can listen to the same channel; only unsubscribe
// once the last of them is gone.
const refCounts = new Map<string, number>();

export function subscribe(name: string): Channel | null {
    const pusher = getPusher();
    if (!pusher) return null;
    refCounts.set(name, (refCounts.get(name) ?? 0) + 1);
    return pusher.subscribe(name);
}

export function unsubscribe(name: string) {
    const count = (refCounts.get(name) ?? 1) - 1;
    if (count > 0) {
        refCounts.set(name, count);
        return;
    }
    refCounts.delete(name);
    getPusher()?.unsubscribe(name);
}
