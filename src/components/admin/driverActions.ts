import type { DriverStatus } from "@/generated/prisma/client";

// What an admin can do to a driver from each state.
export const DRIVER_ACTIONS: Record<
    DriverStatus,
    { to: DriverStatus; label: string; variant: "primary" | "secondary" | "danger"; confirm?: string }[]
> = {
    PENDING: [
        { to: "APPROVED", label: "Approve", variant: "primary" },
        { to: "REJECTED", label: "Reject", variant: "danger", confirm: "Reject this driver application?" },
    ],
    APPROVED: [
        {
            to: "SUSPENDED",
            label: "Suspend",
            variant: "danger",
            confirm: "Suspend this driver? They'll be taken offline immediately.",
        },
    ],
    SUSPENDED: [{ to: "APPROVED", label: "Reinstate", variant: "primary" }],
    REJECTED: [{ to: "APPROVED", label: "Approve", variant: "secondary" }],
};
