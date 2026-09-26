import { handle, HttpError, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { publish } from "@/lib/pusher-server";
import { channels, events } from "@/lib/realtime";
import { readJson } from "@/lib/validate";
import { SURGE_LIMITS } from "@/utils/pricing";
import type { Prisma } from "@/generated/prisma/client";

// Sane upper bounds (in naira) to catch typos like an extra zero.
const MONEY_FIELDS = {
    baseFare: 100_000,
    perKm: 10_000,
    perMinute: 5_000,
    minimumFare: 200_000,
    bookingFee: 10_000,
} as const;

type Field = keyof typeof MONEY_FIELDS | "surgeMultiplier" | "surgeNote";

// Admin updates rates and/or surge for one tier. Only sent fields change.
export const POST = handle(
    async (req: Request, { params }: { params: Promise<{ tier: string }> }) => {
        const admin = await requireUser("ADMIN");
        const { tier } = await params;
        const body = await readJson(req);

        const current = await prisma.pricingTier.findUnique({ where: { tier } });
        if (!current) throw new HttpError(404, "Unknown vehicle type");

        const data: Prisma.PricingTierUpdateInput & Partial<Record<Field, number | string | null>> = {};

        for (const [field, max] of Object.entries(MONEY_FIELDS) as [keyof typeof MONEY_FIELDS, number][]) {
            if (body[field] === undefined) continue;
            const value = Number(body[field]);
            if (!Number.isInteger(value) || value < 0 || value > max) {
                throw new HttpError(400, `${field} must be a whole number between 0 and ${max.toLocaleString()}`);
            }
            data[field] = value;
        }

        if (body.surgeMultiplier !== undefined) {
            const surge = Math.round(Number(body.surgeMultiplier) * 100) / 100;
            if (!Number.isFinite(surge) || surge < SURGE_LIMITS.min || surge > SURGE_LIMITS.max) {
                throw new HttpError(400, `Surge must be between ${SURGE_LIMITS.min}× and ${SURGE_LIMITS.max}×`);
            }
            data.surgeMultiplier = surge;
            // Turning surge off clears its note.
            if (surge === 1) data.surgeNote = null;
        }
        if (body.surgeNote !== undefined && data.surgeNote !== null) {
            const note = typeof body.surgeNote === "string" ? body.surgeNote.trim().slice(0, 80) : "";
            data.surgeNote = note || null;
        }

        // Record only what actually changed.
        const changed = (Object.keys(data) as Field[]).filter((f) => current[f] !== data[f]);
        if (changed.length === 0) return Response.json({ changed: [] });

        const before = Object.fromEntries(changed.map((f) => [f, current[f]]));
        const after = Object.fromEntries(changed.map((f) => [f, data[f]]));

        const [updated] = await prisma.$transaction([
            prisma.pricingTier.update({ where: { tier }, data }),
            prisma.pricingChange.create({
                data: { tier, changedById: admin.id, before, after },
            }),
        ]);

        await publish(channels.pricing, events.pricingUpdated, { tier });
        return Response.json({ changed, pricing: updated });
    },
);
