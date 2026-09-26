import { useEffect, useRef } from "react";
import { subscribe, unsubscribe } from "@/lib/pusher-client";

/** Runs `handler` whenever `event` fires on the private channel. Pass null to stay unsubscribed. */
export function useChannelEvent<T>(
    channelName: string | null,
    event: string,
    handler: (data: T) => void,
) {
    const handlerRef = useRef(handler);
    handlerRef.current = handler;

    useEffect(() => {
        if (!channelName) return;
        const channel = subscribe(channelName);
        if (!channel) return;

        const listener = (data: T) => handlerRef.current(data);
        channel.bind(event, listener);
        return () => {
            channel.unbind(event, listener);
            unsubscribe(channelName);
        };
    }, [channelName, event]);
}
