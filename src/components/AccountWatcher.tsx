"use client";

import { useRouter } from "next/navigation";
import { useChannelEvent } from "@/hooks/useChannelEvent";
import { channels, events } from "@/lib/realtime";

/** Reloads server data when an admin changes this account (approval, suspension). */
export default function AccountWatcher({ userId }: { userId: string }) {
    const router = useRouter();
    useChannelEvent(channels.user(userId), events.accountUpdated, () => router.refresh());
    return null;
}
