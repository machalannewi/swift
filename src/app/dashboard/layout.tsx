import { redirect } from "next/navigation";
import Navbar from "@/components/dashboard/Navbar";
import BottomNavigation from "@/components/dashboard/BottomNavigation";
import { getCurrentUser } from "@/lib/auth";

export default async function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const user = await getCurrentUser();
    if (!user) redirect("/sign-in");
    if (user.role === "DRIVER") redirect("/driver");

    return (
        <div className="min-h-screen bg-neutral-950 text-white">
            <Navbar variant="rider" />
            <main className="pb-32 md:pb-12">{children}</main>
            <BottomNavigation variant="rider" />
        </div>
    );
}
