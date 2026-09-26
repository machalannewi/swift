import { redirect } from "next/navigation";
import Navbar from "@/components/dashboard/Navbar";
import BottomNavigation from "@/components/dashboard/BottomNavigation";
import AccountWatcher from "@/components/AccountWatcher";
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

    // A suspended account overrides an otherwise-approved driver profile.
    const status = user.suspendedAt ? "SUSPENDED" : user.driverProfile.status;

    return (
        <div className="min-h-screen bg-neutral-950 text-white">
            <AccountWatcher userId={user.id} />
            <Navbar variant="driver" />
            <main className="pb-32 md:pb-12">
                {status === "APPROVED" ? children : <DriverStatusScreen status={status} />}
            </main>
            {status === "APPROVED" && <BottomNavigation variant="driver" />}
        </div>
    );
}
