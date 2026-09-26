import { redirect } from "next/navigation";
import Navbar from "@/components/dashboard/Navbar";
import BottomNavigation from "@/components/dashboard/BottomNavigation";
import DriverStatusScreen from "@/components/driver/DriverStatusScreen";
import { getCurrentUser } from "@/lib/auth";

export default async function DriverPortalLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const user = await getCurrentUser();
    if (!user) redirect("/driver/sign-in");
    if (user.role !== "DRIVER" || !user.driverProfile) redirect("/driver/onboarding");

    const { status } = user.driverProfile;

    return (
        <div className="min-h-screen bg-neutral-950 text-white">
            <Navbar variant="driver" />
            <main className="pb-32 md:pb-12">
                {status === "APPROVED" ? children : <DriverStatusScreen status={status} />}
            </main>
            {status === "APPROVED" && <BottomNavigation variant="driver" />}
        </div>
    );
}
