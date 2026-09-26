import { notFound, redirect } from "next/navigation";
import Navbar from "@/components/dashboard/Navbar";
import BottomNavigation from "@/components/dashboard/BottomNavigation";
import { getCurrentUser } from "@/lib/auth";

export default async function AdminLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const user = await getCurrentUser();
    if (!user) redirect("/sign-in");
    // Don't reveal that the admin area exists.
    if (user.role !== "ADMIN") notFound();

    return (
        <div className="min-h-screen bg-neutral-950 text-white">
            <Navbar variant="admin" />
            <main className="pb-32 md:pb-12">{children}</main>
            <BottomNavigation variant="admin" />
        </div>
    );
}
