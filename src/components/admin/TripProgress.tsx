import { X } from "lucide-react";
import { twMerge } from "tailwind-merge";

type Timestamps = {
    status: string;
    requestedAt: Date;
    acceptedAt: Date | null;
    arrivedAt: Date | null;
    startedAt: Date | null;
    completedAt: Date | null;
};

const STEPS = [
    { key: "requestedAt", label: "Requested" },
    { key: "acceptedAt", label: "Accepted" },
    { key: "arrivedAt", label: "Arrived" },
    { key: "startedAt", label: "Started" },
    { key: "completedAt", label: "Completed" },
] as const;

const time = (d: Date) => d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

/** Five-step trip timeline: where the trip is, or where it stopped if cancelled. */
export default function TripProgress({ ride, showLabel = true }: { ride: Timestamps; showLabel?: boolean }) {
    const reached = STEPS.filter((s) => ride[s.key] != null).length;
    const cancelled = ride.status === "CANCELLED";
    const current = cancelled ? "Cancelled" : STEPS[reached - 1]?.label;
    const summary = STEPS.filter((s) => ride[s.key])
        .map((s) => `${s.label} ${time(ride[s.key] as Date)}`)
        .join(" · ");

    return (
        <div
            className="flex items-center gap-3"
            title={summary}
            aria-label={`${current}, ${reached} of ${STEPS.length} steps`}
        >
            <div className="flex items-center" aria-hidden>
                {STEPS.map((step, i) => {
                    const done = i < reached;
                    const stoppedHere = cancelled && i === reached;
                    return (
                        <div key={step.key} className="flex items-center">
                            {i > 0 && (
                                <span
                                    className={twMerge(
                                        "h-0.5 w-3 md:w-4",
                                        done ? "bg-lime-400" : "bg-white/15",
                                    )}
                                />
                            )}
                            {stoppedHere ? (
                                <span className="size-3.5 rounded-full bg-pink-500 text-neutral-950 inline-flex items-center justify-center">
                                    <X size={9} strokeWidth={4} />
                                </span>
                            ) : (
                                <span
                                    className={twMerge(
                                        "size-2.5 rounded-full",
                                        done ? "bg-lime-400" : "bg-white/15",
                                        done && i === reached - 1 && !cancelled && ride.status !== "COMPLETED" &&
                                            "ring-4 ring-lime-400/25",
                                    )}
                                />
                            )}
                        </div>
                    );
                })}
            </div>
            {showLabel && (
                <span
                    className={twMerge(
                        "text-xs font-medium whitespace-nowrap",
                        cancelled ? "text-pink-400" : ride.status === "COMPLETED" ? "text-lime-400" : "text-white",
                    )}
                >
                    {current}
                </span>
            )}
        </div>
    );
}
