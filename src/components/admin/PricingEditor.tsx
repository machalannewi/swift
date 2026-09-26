"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { Spinner } from "@/components/ui/spinner";
import { api } from "@/lib/api-client";
import { calculateFare, isSurging, SURGE_LIMITS, type TierPricing } from "@/utils/pricing";
import { formatNaira, getCar } from "@/utils/CarListData";

const RATE_FIELDS = [
    { key: "baseFare", label: "Base fare", hint: "Charged on every trip" },
    { key: "perKm", label: "Per km", hint: "× trip distance" },
    { key: "perMinute", label: "Per minute", hint: "× estimated trip time" },
    { key: "minimumFare", label: "Minimum fare", hint: "Before booking fee" },
    { key: "bookingFee", label: "Booking fee", hint: "Added after surge" },
] as const;

type RateKey = (typeof RATE_FIELDS)[number]["key"];

const SURGE_PRESETS = [1.2, 1.5, 1.8, 2];

// Typical trips used to preview what riders would pay.
const SAMPLE_TRIPS = [
    { label: "Short · 3 km, 10 min", meters: 3000, seconds: 600 },
    { label: "Medium · 10 km, 25 min", meters: 10000, seconds: 1500 },
    { label: "Long · 25 km, 50 min", meters: 25000, seconds: 3000 },
];

export default function PricingEditor({ pricing }: { pricing: TierPricing }) {
    const router = useRouter();
    const car = getCar(pricing.tier);
    const [rates, setRates] = useState<Record<RateKey, string>>(() =>
        Object.fromEntries(RATE_FIELDS.map((f) => [f.key, String(pricing[f.key])])) as Record<RateKey, string>,
    );
    const [surge, setSurge] = useState(String(pricing.surgeMultiplier));
    const [note, setNote] = useState(pricing.surgeNote ?? "");
    const [busy, setBusy] = useState<"rates" | "surge" | null>(null);
    const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

    const parsed = Object.fromEntries(
        RATE_FIELDS.map((f) => [f.key, Number(rates[f.key])]),
    ) as Record<RateKey, number>;
    const ratesValid = RATE_FIELDS.every((f) => Number.isInteger(parsed[f.key]) && parsed[f.key] >= 0);
    const ratesDirty = RATE_FIELDS.some((f) => parsed[f.key] !== pricing[f.key]);
    const draft: TierPricing = ratesValid ? { ...pricing, ...parsed } : pricing;

    const save = async (kind: "rates" | "surge", body: object, confirmText?: string) => {
        if (confirmText && !confirm(confirmText)) return;
        setBusy(kind);
        setMessage(null);
        try {
            const res = await api<{ changed: string[] }>(`/api/admin/pricing/${pricing.tier}`, { body });
            setMessage({
                ok: true,
                text: res.changed.length ? "Saved. New requests use these prices now." : "Nothing changed.",
            });
            router.refresh();
        } catch (err) {
            setMessage({ ok: false, text: err instanceof Error ? err.message : "Could not save" });
        } finally {
            setBusy(null);
        }
    };

    const applySurge = (value: number) => {
        save(
            "surge",
            { surgeMultiplier: value, surgeNote: value > 1 ? note : null },
            value >= 2
                ? `Set ${car?.name} surge to ${value}×? Riders will pay ${value} times the normal ride fare.`
                : undefined,
        );
    };

    return (
        <section className="bg-neutral-900 border border-white/10 rounded-3xl p-5 md:p-6">
            <div className="flex items-center justify-between gap-4">
                <h2 className="text-2xl font-medium">{car?.name ?? pricing.tier}</h2>
                {isSurging(pricing) ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 px-3 py-1 text-sm font-semibold text-neutral-950">
                        <Zap size={14} /> Surge {pricing.surgeMultiplier}×
                    </span>
                ) : (
                    <span className="rounded-full border border-white/15 px-3 py-1 text-sm text-white/50">No surge</span>
                )}
            </div>

            {/* Rates */}
            <form
                className="mt-6"
                onSubmit={(e) => {
                    e.preventDefault();
                    if (ratesValid && ratesDirty) save("rates", parsed);
                }}
            >
                <div className="grid grid-cols-2 gap-3">
                    {RATE_FIELDS.map((f) => {
                        const changed = parsed[f.key] !== pricing[f.key];
                        return (
                            <label key={f.key} className="flex flex-col gap-1.5">
                                <span className="text-sm text-white/70">{f.label}</span>
                                <span
                                    className={twMerge(
                                        "flex items-center h-11 rounded-full border border-white/15 bg-neutral-950 px-4 focus-within:border-lime-400 transition",
                                        changed && "border-lime-400/60",
                                    )}
                                >
                                    <span className="text-white/40 mr-1">₦</span>
                                    <input
                                        type="number"
                                        min={0}
                                        step={1}
                                        inputMode="numeric"
                                        value={rates[f.key]}
                                        onChange={(e) => setRates((r) => ({ ...r, [f.key]: e.target.value }))}
                                        className="bg-transparent outline-none w-full tabular-nums"
                                    />
                                </span>
                                <span className="text-xs text-white/40">{f.hint}</span>
                            </label>
                        );
                    })}
                </div>

                <div className="mt-4 flex items-center gap-3">
                    <button
                        type="submit"
                        disabled={!ratesDirty || !ratesValid || busy !== null}
                        className="inline-flex items-center justify-center h-10 rounded-full bg-lime-400 px-5 text-sm font-medium text-neutral-950 hover:bg-lime-300 transition disabled:opacity-40 disabled:pointer-events-none"
                    >
                        {busy === "rates" ? <Spinner /> : "Save rates"}
                    </button>
                    {ratesDirty && (
                        <button
                            type="button"
                            onClick={() =>
                                setRates(
                                    Object.fromEntries(
                                        RATE_FIELDS.map((f) => [f.key, String(pricing[f.key])]),
                                    ) as Record<RateKey, string>,
                                )
                            }
                            className="text-sm text-white/50 hover:text-white transition"
                        >
                            Reset
                        </button>
                    )}
                    {!ratesValid && <span className="text-sm text-red-400">Use whole numbers, 0 or more.</span>}
                </div>
            </form>

            {/* Preview */}
            <div className="mt-6 rounded-2xl border border-white/10 bg-neutral-950 p-4">
                <p className="text-sm text-white/50 mb-2">
                    What riders pay{isSurging(pricing) ? " (with current surge)" : ""}
                </p>
                {SAMPLE_TRIPS.map((trip) => {
                    const now = calculateFare(pricing, trip.meters, trip.seconds).total;
                    const next = calculateFare(draft, trip.meters, trip.seconds).total;
                    return (
                        <div key={trip.label} className="flex justify-between gap-4 py-1 text-sm">
                            <span className="text-white/70">{trip.label}</span>
                            <span className="tabular-nums">
                                {ratesDirty && next !== now ? (
                                    <>
                                        <span className="text-white/40 line-through mr-2">{formatNaira(now)}</span>
                                        <span className="text-lime-400 font-medium">{formatNaira(next)}</span>
                                    </>
                                ) : (
                                    formatNaira(now)
                                )}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Surge */}
            <div className="mt-6 pt-6 border-t border-white/10">
                <p className="font-medium flex items-center gap-2">
                    <Zap size={16} className="text-pink-400" /> Surge
                </p>
                <p className="text-sm text-white/50 mt-1">
                    Multiplies the ride fare (not the booking fee). Riders see a “higher demand” notice.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                    <SurgeButton active={pricing.surgeMultiplier === 1} disabled={busy !== null} onClick={() => applySurge(1)}>
                        Off
                    </SurgeButton>
                    {SURGE_PRESETS.map((p) => (
                        <SurgeButton
                            key={p}
                            active={pricing.surgeMultiplier === p}
                            disabled={busy !== null}
                            onClick={() => applySurge(p)}
                        >
                            {p}×
                        </SurgeButton>
                    ))}
                </div>
                <div className="mt-3 flex flex-col gap-2">
                    <input
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        maxLength={80}
                        placeholder="Reason for riders (optional), e.g. Heavy rain"
                        aria-label="Surge reason shown to riders"
                        className="h-10 w-full rounded-full border border-white/15 bg-neutral-950 px-4 text-sm outline-none focus:border-lime-400 transition placeholder:text-white/30"
                    />
                    <span className="flex items-center gap-2">
                        <span className="text-sm text-white/50">Custom</span>
                        <input
                            type="number"
                            min={SURGE_LIMITS.min}
                            max={SURGE_LIMITS.max}
                            step={0.1}
                            value={surge}
                            onChange={(e) => setSurge(e.target.value)}
                            aria-label="Custom surge multiplier"
                            className="h-10 w-20 rounded-full border border-white/15 bg-neutral-950 px-3 text-sm outline-none focus:border-lime-400 transition tabular-nums"
                        />
                        <button
                            type="button"
                            disabled={busy !== null}
                            onClick={() => applySurge(Number(surge))}
                            className="h-10 rounded-full border border-white/20 px-4 text-sm font-medium hover:border-white hover:bg-white/10 transition disabled:opacity-50"
                        >
                            {busy === "surge" ? <Spinner /> : "Apply"}
                        </button>
                    </span>
                </div>
                {isSurging(pricing) && pricing.surgeNote && (
                    <p className="mt-2 text-xs text-white/40">Showing riders: “{pricing.surgeNote}”</p>
                )}
            </div>

            {message && (
                <p className={twMerge("mt-4 text-sm", message.ok ? "text-lime-400" : "text-red-400")} role="status">
                    {message.text}
                </p>
            )}
        </section>
    );
}

function SurgeButton({
    active,
    disabled,
    onClick,
    children,
}: {
    active: boolean;
    disabled: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            disabled={disabled || active}
            onClick={onClick}
            aria-pressed={active}
            className={twMerge(
                "h-9 min-w-14 rounded-full border px-4 text-sm font-medium transition duration-300 disabled:cursor-default",
                active
                    ? "border-transparent bg-gradient-to-r from-purple-400 to-pink-400 text-neutral-950"
                    : "border-white/15 hover:border-white/40 disabled:opacity-50",
            )}
        >
            {children}
        </button>
    );
}
