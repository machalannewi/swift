import "server-only";
import Pusher from "pusher";

const isConfigured = Boolean(
    process.env.PUSHER_APP_ID &&
        process.env.NEXT_PUBLIC_PUSHER_KEY &&
        process.env.PUSHER_SECRET,
);

export const pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID ?? "",
    key: process.env.NEXT_PUBLIC_PUSHER_KEY ?? "",
    secret: process.env.PUSHER_SECRET ?? "",
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER ?? "eu",
    useTLS: true,
});

/**
 * Sends an event to one or more channels. Never throws: the database is the
 * source of truth, so a failed broadcast must not undo a saved change -
 * clients also re-sync on their own.
 */
export async function publish(channels: string | string[], event: string, data: unknown) {
    const list = Array.isArray(channels) ? channels : [channels];
    if (!list.length) return;
    if (!isConfigured) {
        console.warn(`[pusher] not configured - skipped "${event}"`);
        return;
    }
    try {
        // Pusher accepts at most 100 channels per trigger call.
        for (let i = 0; i < list.length; i += 100) {
            await pusher.trigger(list.slice(i, i + 100), event, data);
        }
    } catch (err) {
        console.error(`[pusher] failed to publish "${event}"`, err);
    }
}
