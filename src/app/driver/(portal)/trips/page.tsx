import { redirect } from "next/navigation";
import RideHistoryView from "@/components/dashboard/RideHistoryView";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rideInclude, serializeRide } from "@/lib/rides";
import { formatNaira } from "@/utils/CarListData";

export default async function DriverTripsPage() {
    const user = await getCurrentUser();
    if (!user) redirect("/driver/sign-in");

    const rides = await prisma.ride.findMany({
        where: { driverId: user.id },
        include: rideInclude,
        orderBy: { requestedAt: "desc" },
        take: 100,
    });

    const completed = rides.filter((r) => r.status === "COMPLETED");
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const today = completed
        .filter((r) => r.completedAt && r.completedAt >= startOfToday)
        .reduce((sum, r) => sum + r.fare, 0);
    const total = completed.reduce((sum, r) => sum + r.fare, 0);

    return (
        <RideHistoryView
            tag="Trips & Earnings"
            title="Your"
            accent="earnings"
            perspective="driver"
            rides={rides.map(serializeRide)}
            stats={[
                { label: "Earned today", value: formatNaira(today) },
                { label: "Total earned", value: formatNaira(total) },
                { label: "Trips completed", value: completed.length.toString() },
            ]}
            empty={{
                title: "No trips yet",
                body: "Go online to start receiving ride requests.",
                cta: { label: "Start driving", href: "/driver" },
            }}
        />
    );
}
