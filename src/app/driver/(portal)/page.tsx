import { redirect } from "next/navigation";
import DriverHome from "@/components/driver/DriverHome";
import { getCurrentUser } from "@/lib/auth";

export default async function DriverPage() {
    const user = await getCurrentUser();
    const profile = user?.driverProfile;
    if (!user || !profile) redirect("/driver/onboarding");

    return (
        <DriverHome
            userId={user.id}
            firstName={user.name?.split(" ")[0] ?? null}
            carTier={profile.carTier}
            initialOnline={profile.isOnline}
        />
    );
}
