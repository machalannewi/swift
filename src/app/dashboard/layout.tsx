import Navbar from "@/components/dashboard/Navbar";
import BottomNavigation from "@/components/dashboard/BottomNavigation";

export default function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="min-h-screen bg-neutral-950 text-white">
            <Navbar />
            <main className="pb-32 md:pb-12">{children}</main>
            <BottomNavigation />
        </div>
    );
}
