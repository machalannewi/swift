import { AdminHeader, Card, timeAgo } from "@/components/admin/ui";
import PricingEditor from "@/components/admin/PricingEditor";
import { getAllPricing } from "@/lib/pricing";
import { prisma } from "@/lib/prisma";
import { formatNaira, getCar } from "@/utils/CarListData";

export const dynamic = "force-dynamic";

const FIELD_LABELS: Record<string, string> = {
    baseFare: "Base fare",
    perKm: "Per km",
    perMinute: "Per minute",
    minimumFare: "Minimum fare",
    bookingFee: "Booking fee",
    surgeMultiplier: "Surge",
    surgeNote: "Surge note",
};

const formatValue = (field: string, value: unknown) => {
    if (value === null || value === undefined || value === "") return "none";
    if (field === "surgeMultiplier") return Number(value) === 1 ? "off" : `${value}×`;
    if (field === "surgeNote") return `“${value}”`;
    return formatNaira(Number(value));
};

export default async function AdminPricingPage() {
    const [pricing, changes] = await Promise.all([
        getAllPricing(),
        prisma.pricingChange.findMany({
            orderBy: { createdAt: "desc" },
            take: 25,
            include: { changedBy: { select: { name: true, email: true } } },
        }),
    ]);

    return (
        <div className="container max-w-7xl">
            <AdminHeader tag="Pricing" title="Fares &" accent="surge" />
            <p className="mt-4 text-white/50 max-w-3xl">
                Fare = max(minimum, (base + per km × distance + per minute × time) × surge) + booking fee.
                Changes apply to new ride requests immediately; rides already requested keep their price.
            </p>

            <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {pricing.map((p) => (
                    // Keyed on updatedAt-derived values so the form resets after a save.
                    <PricingEditor key={JSON.stringify(p)} pricing={p} />
                ))}
            </div>

            <Card title="Change history" className="mt-6">
                {changes.length === 0 ? (
                    <p className="text-white/50">No pricing changes yet.</p>
                ) : (
                    <ul className="divide-y divide-white/5">
                        {changes.map((c) => {
                            const before = c.before as Record<string, unknown>;
                            const after = c.after as Record<string, unknown>;
                            return (
                                <li key={c.id} className="py-3 flex flex-col md:flex-row md:items-center gap-1 md:gap-6">
                                    <div className="md:w-56 flex-shrink-0">
                                        <p className="text-sm font-medium">{getCar(c.tier)?.name ?? c.tier}</p>
                                        <p className="text-xs text-white/40">
                                            {c.changedBy.name ?? c.changedBy.email} · {timeAgo(c.createdAt)}
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
                                        {Object.keys(after).map((field) => (
                                            <span key={field}>
                                                <span className="text-white/50">{FIELD_LABELS[field] ?? field}: </span>
                                                <span className="text-white/40 line-through">
                                                    {formatValue(field, before[field])}
                                                </span>{" "}
                                                → <span className="text-lime-400">{formatValue(field, after[field])}</span>
                                            </span>
                                        ))}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </Card>
        </div>
    );
}
