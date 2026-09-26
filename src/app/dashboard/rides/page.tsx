import { redirect } from "next/navigation";
import RideHistoryView from "@/components/dashboard/RideHistoryView";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { expireStaleRequests, rideInclude, serializeRide } from "@/lib/rides";
import { formatNaira } from "@/utils/CarListData";

export default async function RidesPage() {
    const user = await getCurrentUser();
    if (!user) redirect("/sign-in");

    await expireStaleRequests({ riderId: user.id });
    const rides = await prisma.ride.findMany({
        where: { riderId: user.id },
        include: rideInclude,
        orderBy: { requestedAt: "desc" },
        take: 100,
    });

    const completed = rides.filter((r) => r.status === "COMPLETED");
    const spent = completed.reduce((sum, r) => sum + r.fare, 0);
    const km = completed.reduce((sum, r) => sum + r.distanceMeters, 0) / 1000;

    return (
        <RideHistoryView
            tag="Ride History"
            title="Your"
            accent="journeys"
            perspective="rider"
            rides={rides.map(serializeRide)}
            stats={[
                { label: "Rides completed", value: completed.length.toString() },
                { label: "Total spent", value: formatNaira(spent) },
                { label: "Distance travelled", value: `${km.toFixed(1)} km` },
            ]}
            empty={{
                title: "No rides yet",
                body: "Your trips will show up here once you book them.",
                cta: { label: "Book your first ride", href: "/dashboard" },
            }}
        />
    );
}
