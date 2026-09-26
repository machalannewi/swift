"use client";

import { useEffect, useRef, useState } from "react";
import type { DailyRides } from "@/lib/analytics";

// Validated against the neutral-900 card surface (dataviz palette check:
// lightness band, chroma floor, CVD separation, contrast - all pass).
const SERIES = [
    { key: "completed", label: "Completed", color: "#65a30d" },
    { key: "cancelled", label: "Cancelled", color: "#ec4899" },
] as const;

const HEIGHT = 220;
const PAD = { top: 12, right: 8, bottom: 28, left: 32 };
const GAP = 2; // surface gap between stacked segments
const RADIUS = 4;

const dayLabel = (day: string, opts: Intl.DateTimeFormatOptions) =>
    new Date(`${day}T12:00:00`).toLocaleDateString(undefined, opts);

/** Nice round y-axis maximum and ticks. */
function niceScale(max: number) {
    // Aim for ~4 intervals using 1/2/5 steps; ride counts are whole numbers.
    const rough = max / 4;
    const mag = Math.pow(10, Math.floor(Math.log10(rough)));
    const step = Math.max(1, [1, 2, 5, 10].map((m) => m * mag).find((s) => s >= rough) ?? mag * 10);
    const top = Math.max(step, Math.ceil(max / step) * step);
    const ticks = Array.from({ length: top / step + 1 }, (_, i) => i * step);
    return { top, ticks };
}

/** Bar path with rounded top corners only (data end), flat at the baseline. */
function topRoundedBar(x: number, y: number, w: number, h: number, r: number) {
    const rr = Math.min(r, h, w / 2);
    return `M${x},${y + h} V${y + rr} Q${x},${y} ${x + rr},${y} H${x + w - rr} Q${x + w},${y} ${x + w},${y + rr} V${y + h} Z`;
}

export default function RidesChart({ data }: { data: DailyRides[] }) {
    const wrapRef = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(640);
    const [hover, setHover] = useState<number | null>(null);
    const [showTable, setShowTable] = useState(false);

    useEffect(() => {
        const el = wrapRef.current;
        if (!el) return;
        const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    const totals = data.map((d) => d.completed + d.cancelled);
    const { top, ticks } = niceScale(Math.max(...totals, 1));
    const plotW = Math.max(width - PAD.left - PAD.right, 50);
    const plotH = HEIGHT - PAD.top - PAD.bottom;
    const slot = plotW / data.length;
    const barW = Math.max(4, Math.min(28, slot * 0.55));
    const y = (v: number) => PAD.top + plotH - (v / top) * plotH;
    const labelEvery = width < 480 ? 3 : 2;

    const hovered = hover !== null ? data[hover] : null;

    return (
        <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-4 text-sm text-white/70">
                    {SERIES.map((s) => (
                        <span key={s.key} className="inline-flex items-center gap-2">
                            <span className="size-3 rounded-sm" style={{ background: s.color }} />
                            {s.label}
                        </span>
                    ))}
                </div>
                <button
                    type="button"
                    onClick={() => setShowTable((v) => !v)}
                    className="text-sm text-white/50 hover:text-lime-400 transition"
                    aria-pressed={showTable}
                >
                    {showTable ? "Show chart" : "Show table"}
                </button>
            </div>

            {showTable ? (
                <div className="max-h-64 overflow-auto rounded-2xl border border-white/10">
                    <table className="w-full text-sm">
                        <thead className="text-white/50 text-left sticky top-0 bg-neutral-900">
                            <tr>
                                <th className="font-medium px-4 py-2">Day</th>
                                <th className="font-medium px-4 py-2 text-right">Completed</th>
                                <th className="font-medium px-4 py-2 text-right">Cancelled</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((d) => (
                                <tr key={d.day} className="border-t border-white/5">
                                    <td className="px-4 py-2">
                                        {dayLabel(d.day, { weekday: "short", month: "short", day: "numeric" })}
                                    </td>
                                    <td className="px-4 py-2 text-right tabular-nums">{d.completed}</td>
                                    <td className="px-4 py-2 text-right tabular-nums">{d.cancelled}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div ref={wrapRef} className="relative" onMouseLeave={() => setHover(null)}>
                    <svg
                        width={width}
                        height={HEIGHT}
                        role="img"
                        aria-label="Completed and cancelled rides per day for the last 14 days"
                        className="block"
                    >
                        {/* Recessive grid + y ticks */}
                        {ticks.map((t) => (
                            <g key={t}>
                                <line
                                    x1={PAD.left}
                                    x2={width - PAD.right}
                                    y1={y(t)}
                                    y2={y(t)}
                                    stroke="rgba(255,255,255,0.08)"
                                />
                                <text
                                    x={PAD.left - 8}
                                    y={y(t)}
                                    dy="0.32em"
                                    textAnchor="end"
                                    className="fill-white/40 text-[11px] tabular-nums"
                                >
                                    {t}
                                </text>
                            </g>
                        ))}

                        {data.map((d, i) => {
                            const cx = PAD.left + slot * i + slot / 2;
                            const x = cx - barW / 2;
                            const completedH = (d.completed / top) * plotH;
                            const cancelledH = (d.cancelled / top) * plotH;
                            const baseY = PAD.top + plotH;
                            const hasBoth = d.completed > 0 && d.cancelled > 0;
                            const dim = hover !== null && hover !== i;
                            return (
                                <g key={d.day} opacity={dim ? 0.45 : 1}>
                                    {d.completed > 0 && (
                                        <path
                                            d={
                                                d.cancelled > 0
                                                    ? `M${x},${baseY} V${baseY - completedH} H${x + barW} V${baseY} Z`
                                                    : topRoundedBar(x, baseY - completedH, barW, completedH, RADIUS)
                                            }
                                            fill={SERIES[0].color}
                                        />
                                    )}
                                    {d.cancelled > 0 && (
                                        <path
                                            d={topRoundedBar(
                                                x,
                                                baseY - completedH - cancelledH,
                                                barW,
                                                Math.max(cancelledH - (hasBoth ? GAP : 0), 1),
                                                RADIUS,
                                            )}
                                            fill={SERIES[1].color}
                                        />
                                    )}
                                    {i % labelEvery === (data.length - 1) % labelEvery && (
                                        <text
                                            x={cx}
                                            y={HEIGHT - 8}
                                            textAnchor="middle"
                                            className="fill-white/40 text-[11px]"
                                        >
                                            {dayLabel(d.day, { month: "short", day: "numeric" })}
                                        </text>
                                    )}
                                    {/* Hit target: the whole column, bigger than the mark */}
                                    <rect
                                        x={PAD.left + slot * i}
                                        y={PAD.top}
                                        width={slot}
                                        height={plotH}
                                        fill="transparent"
                                        onMouseEnter={() => setHover(i)}
                                        onFocus={() => setHover(i)}
                                        tabIndex={0}
                                        aria-label={`${d.day}: ${d.completed} completed, ${d.cancelled} cancelled`}
                                    />
                                </g>
                            );
                        })}
                    </svg>

                    {hovered && hover !== null && (
                        <div
                            className="pointer-events-none absolute z-10 rounded-xl border border-white/15 bg-neutral-950/95 px-3 py-2 text-sm shadow-xl"
                            style={{
                                left: Math.min(
                                    Math.max(PAD.left + slot * hover + slot / 2 - 70, 0),
                                    width - 140,
                                ),
                                top: 0,
                                width: 140,
                            }}
                        >
                            <p className="font-medium">
                                {dayLabel(hovered.day, { weekday: "short", month: "short", day: "numeric" })}
                            </p>
                            {SERIES.map((s) => (
                                <p key={s.key} className="flex items-center justify-between gap-3 text-white/70">
                                    <span className="inline-flex items-center gap-2">
                                        <span className="size-2 rounded-sm" style={{ background: s.color }} />
                                        {s.label}
                                    </span>
                                    <span className="tabular-nums text-white">{hovered[s.key]}</span>
                                </p>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
