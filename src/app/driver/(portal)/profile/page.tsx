import { redirect } from "next/navigation";
import ProfileView from "@/components/dashboard/ProfileView";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCar } from "@/utils/CarListData";

export default async function DriverProfilePage() {
    const user = await getCurrentUser();
    const profile = user?.driverProfile;
    if (!user || !profile) redirect("/driver/onboarding");

    const trips = await prisma.ride.count({
        where: { driverId: user.id, status: "COMPLETED" },
    });

    return (
        <ProfileView
            badge={`🚗 ${trips} ${trips === 1 ? "trip" : "trips"} completed`}
            extraDetails={[
                { icon: "phone", label: "Phone", value: profile.phone },
                {
                    icon: "car",
                    label: `Vehicle · ${getCar(profile.carTier)?.name ?? profile.carTier}`,
                    value: `${profile.vehicleColor} ${profile.vehicleMake} ${profile.vehicleModel} (${profile.plateNumber})`,
                },
                { icon: "id", label: "Driver's licence", value: profile.licenseNumber },
                { icon: "shield", label: "Account status", value: profile.status.toLowerCase() },
            ]}
        />
    );
}
