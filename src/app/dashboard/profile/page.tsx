import { redirect } from "next/navigation";
import ProfileView from "@/components/dashboard/ProfileView";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function ProfilePage() {
    const user = await getCurrentUser();
    if (!user) redirect("/sign-in");

    const rides = await prisma.ride.count({
        where: { riderId: user.id, status: "COMPLETED" },
    });

    return (
        <ProfileView badge={`✨ ${rides} ${rides === 1 ? "ride" : "rides"} with Swift`} />
    );
}
