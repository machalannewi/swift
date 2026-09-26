import { redirect } from "next/navigation";
import Navbar from "@/components/dashboard/Navbar";
import BottomNavigation from "@/components/dashboard/BottomNavigation";
import AccountWatcher from "@/components/AccountWatcher";
import SuspendedScreen from "@/components/SuspendedScreen";
import { getCurrentUser } from "@/lib/auth";

export default async function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const user = await getCurrentUser();
    if (!user) redirect("/sign-in");
    if (user.role === "DRIVER") redirect("/driver");

    const suspended = !!user.suspendedAt && user.role !== "ADMIN";

    return (
        <div className="min-h-screen bg-neutral-950 text-white">
            <AccountWatcher userId={user.id} />
            <Navbar variant="rider" />
            <main className="pb-32 md:pb-12">{suspended ? <SuspendedScreen /> : children}</main>
            {!suspended && <BottomNavigation variant="rider" />}
        </div>
    );
}
