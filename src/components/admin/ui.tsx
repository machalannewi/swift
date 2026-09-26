import Link from "next/link";
import { twMerge } from "tailwind-merge";
import Tag from "@/components/Tag";
import LiveRefresh from "./LiveRefresh";

export function AdminHeader({
    tag,
    title,
    accent,
    children,
}: {
    tag: string;
    title: string;
    accent: string;
    children?: React.ReactNode;
}) {
    return (
        <div className="mt-4 lg:mt-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
                <div className="flex items-center gap-3">
                    <Tag>{tag}</Tag>
                    <LiveRefresh />
                </div>
                <h1 className="text-4xl md:text-6xl font-medium mt-4">
                    {title} <span className="text-lime-400">{accent}</span>
                </h1>
            </div>
            {children}
        </div>
    );
}

export function StatTile({
    label,
    value,
    hint,
    href,
    highlight,
}: {
    label: string;
    value: string;
    hint?: string;
    href?: string;
    highlight?: boolean;
}) {
    const body = (
        <>
            <p className="text-white/50 text-sm">{label}</p>
            <p className="text-3xl md:text-4xl font-medium mt-2 tabular-nums">{value}</p>
            {hint && <p className="text-xs text-white/40 mt-1">{hint}</p>}
        </>
    );
    const className = twMerge(
        "block bg-neutral-900 border border-white/10 rounded-3xl p-5 md:p-6 transition duration-500",
        highlight && "border-lime-400/60",
        href && "hover:scale-[1.02] hover:border-white/30",
    );
    return href ? (
        <Link href={href} className={className}>
            {body}
        </Link>
    ) : (
        <div className={className}>{body}</div>
    );
}

export function Card({
    title,
    action,
    className,
    children,
}: {
    title?: string;
    action?: React.ReactNode;
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <section
            className={twMerge("bg-neutral-900 border border-white/10 rounded-3xl p-5 md:p-6", className)}
        >
            {(title || action) && (
                <div className="flex items-center justify-between gap-4 mb-4">
                    {title && <h2 className="text-xl font-medium">{title}</h2>}
                    {action}
                </div>
            )}
            {children}
        </section>
    );
}

const pillStyles: Record<string, string> = {
    REQUESTED: "bg-neutral-800 text-white",
    ACCEPTED: "bg-gradient-to-r from-purple-400 to-pink-400 text-neutral-950",
    ARRIVED: "bg-gradient-to-r from-purple-400 to-pink-400 text-neutral-950",
    IN_PROGRESS: "bg-lime-400 text-neutral-950",
    COMPLETED: "bg-lime-400/15 text-lime-400",
    CANCELLED: "bg-neutral-800 text-white/50",
    PENDING: "bg-neutral-800 text-white",
    APPROVED: "bg-lime-400/15 text-lime-400",
    REJECTED: "bg-neutral-800 text-white/50",
    SUSPENDED: "bg-red-500/15 text-red-400",
};

export function StatusPill({ status, className }: { status: string; className?: string }) {
    return (
        <span
            className={twMerge(
                "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
                pillStyles[status] ?? "bg-neutral-800 text-white",
                className,
            )}
        >
            {status.replace("_", " ").toLowerCase()}
        </span>
    );
}

export function FilterTabs({
    tabs,
    active,
}: {
    tabs: { label: string; href: string; key: string; count?: number }[];
    active: string;
}) {
    return (
        <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
                <Link
                    key={tab.key}
                    href={tab.href}
                    className={twMerge(
                        "inline-flex items-center gap-2 rounded-full border px-4 h-10 text-sm font-medium transition duration-300",
                        tab.key === active
                            ? "border-lime-400 bg-lime-400 text-neutral-950"
                            : "border-white/15 hover:border-white/40",
                    )}
                >
                    {tab.label}
                    {tab.count !== undefined && (
                        <span
                            className={twMerge(
                                "rounded-full px-1.5 text-xs tabular-nums",
                                tab.key === active ? "bg-neutral-950/15" : "bg-white/10",
                            )}
                        >
                            {tab.count}
                        </span>
                    )}
                </Link>
            ))}
        </div>
    );
}

export const formatDuration = (seconds: number | null) => {
    if (seconds == null) return "-";
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const m = Math.round(seconds / 60);
    return m < 60 ? `${m} min` : `${Math.floor(m / 60)}h ${m % 60}m`;
};

export const timeAgo = (iso: string | Date) => {
    const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 60) return "just now";
    if (s < 3600) return `${Math.floor(s / 60)} min ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
};
