"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { twMerge } from "tailwind-merge";
import { Spinner } from "@/components/ui/spinner";
import { api } from "@/lib/api-client";

const variants = {
    primary: "bg-lime-400 border-lime-400 text-neutral-950 hover:bg-lime-300 hover:border-lime-300",
    secondary: "border-white/20 hover:border-white hover:bg-white/10",
    danger: "border-red-400/40 text-red-400 hover:bg-red-400/10 hover:border-red-400",
};

/** Calls an admin API endpoint, then re-renders the page with fresh data. */
export default function AdminActionButton({
    url,
    body = {},
    label,
    confirmText,
    variant = "secondary",
    className,
}: {
    url: string;
    body?: object;
    label: string;
    confirmText?: string;
    variant?: keyof typeof variants;
    className?: string;
}) {
    const router = useRouter();
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    const run = async () => {
        if (confirmText && !confirm(confirmText)) return;
        setBusy(true);
        setError("");
        try {
            await api(url, { body });
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Action failed");
        } finally {
            setBusy(false);
        }
    };

    return (
        <span className="inline-flex flex-col items-end gap-1">
            <button
                type="button"
                onClick={run}
                disabled={busy}
                className={twMerge(
                    "inline-flex items-center justify-center gap-2 h-9 min-w-20 rounded-full border px-4 text-sm font-medium transition duration-300 disabled:opacity-50",
                    variants[variant],
                    className,
                )}
            >
                {busy ? <Spinner /> : label}
            </button>
            {error && (
                <span className="text-xs text-red-400 max-w-56 text-right" role="alert">
                    {error}
                </span>
            )}
        </span>
    );
}
