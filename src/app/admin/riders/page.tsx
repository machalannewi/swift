import Image from "next/image";
import { Search } from "lucide-react";
import { AdminHeader, Card, StatusPill, timeAgo } from "@/components/admin/ui";
import AdminActionButton from "@/components/admin/AdminActionButton";
import { prisma } from "@/lib/prisma";
import { formatNaira } from "@/utils/CarListData";
import type { Prisma } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

export default async function AdminRidersPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string }>;
}) {
    const { q = "" } = await searchParams;
    const query = q.trim().slice(0, 100);

    const where: Prisma.UserWhereInput = {
        role: "RIDER",
        ...(query
            ? {
                  OR: [
                      { name: { contains: query, mode: "insensitive" } },
                      { email: { contains: query, mode: "insensitive" } },
                  ],
              }
            : {}),
    };

    const riders = await prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 100,
        select: { id: true, name: true, email: true, imageUrl: true, createdAt: true, suspendedAt: true },
    });

    const stats = await prisma.ride.groupBy({
        by: ["riderId", "status"],
        where: { riderId: { in: riders.map((r) => r.id) }, status: { in: ["COMPLETED", "CANCELLED"] } },
        _count: true,
        _sum: { fare: true },
    });
    const statFor = (id: string, status: "COMPLETED" | "CANCELLED") =>
        stats.find((s) => s.riderId === id && s.status === status);

    return (
        <div className="container max-w-7xl">
            <AdminHeader tag="Riders" title="Rider" accent="accounts">
                <form className="flex items-center gap-2 h-12 w-full md:w-80 rounded-full border border-white/15 bg-neutral-900 px-4 focus-within:border-lime-400 transition">
                    <Search size={16} className="text-white/40" />
                    <input
                        name="q"
                        defaultValue={query}
                        placeholder="Search name or email"
                        className="bg-transparent outline-none w-full placeholder:text-white/30"
                    />
                </form>
            </AdminHeader>

            <Card className="mt-8 p-0 md:p-0 overflow-hidden">
                {riders.length === 0 ? (
                    <p className="p-8 text-center text-white/50">
                        {query ? `No riders match "${query}".` : "No riders yet."}
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="text-left text-white/40 text-xs">
                                <tr>
                                    <th className="font-medium px-6 py-3">Rider</th>
                                    <th className="font-medium px-4 py-3">Joined</th>
                                    <th className="font-medium px-4 py-3 text-right">Completed</th>
                                    <th className="font-medium px-4 py-3 text-right">Cancelled</th>
                                    <th className="font-medium px-4 py-3 text-right">Spent</th>
                                    <th className="font-medium px-6 py-3 text-right">Account</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {riders.map((r) => {
                                    const done = statFor(r.id, "COMPLETED");
                                    const cancelled = statFor(r.id, "CANCELLED");
                                    return (
                                        <tr key={r.id}>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3 min-w-56">
                                                    {r.imageUrl ? (
                                                        <Image
                                                            src={r.imageUrl}
                                                            alt=""
                                                            width={36}
                                                            height={36}
                                                            className="rounded-full size-9 object-cover"
                                                        />
                                                    ) : (
                                                        <span className="size-9 rounded-full bg-neutral-800" />
                                                    )}
                                                    <div className="min-w-0">
                                                        <p className="font-medium truncate">{r.name ?? "Unnamed"}</p>
                                                        <p className="text-xs text-white/40 truncate">{r.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-white/60 whitespace-nowrap">
                                                {timeAgo(r.createdAt)}
                                            </td>
                                            <td className="px-4 py-4 text-right tabular-nums">{done?._count ?? 0}</td>
                                            <td className="px-4 py-4 text-right tabular-nums">{cancelled?._count ?? 0}</td>
                                            <td className="px-4 py-4 text-right tabular-nums">
                                                {formatNaira(done?._sum.fare ?? 0)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-3">
                                                    {r.suspendedAt && <StatusPill status="SUSPENDED" />}
                                                    <AdminActionButton
                                                        url={`/api/admin/users/${r.id}/suspension`}
                                                        body={{ suspended: !r.suspendedAt }}
                                                        label={r.suspendedAt ? "Reinstate" : "Suspend"}
                                                        variant={r.suspendedAt ? "primary" : "danger"}
                                                        confirmText={
                                                            r.suspendedAt
                                                                ? undefined
                                                                : "Suspend this rider? Any ride they're waiting for is cancelled."
                                                        }
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </div>
    );
}
