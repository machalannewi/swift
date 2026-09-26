import { BadgePercent, Car, CarFront, CircleHelp, Home, LayoutDashboard, Route, User, Users, Wallet } from "lucide-react";

export const dashboardLinks = [
    { href: "/dashboard", label: "Book", icon: Home },
    { href: "/dashboard/rides", label: "My Rides", icon: Car },
    { href: "/dashboard/profile", label: "Profile", icon: User },
    { href: "/dashboard/info", label: "Help", icon: CircleHelp },
];

export const driverLinks = [
    { href: "/driver", label: "Drive", icon: Route },
    { href: "/driver/trips", label: "Trips", icon: Wallet },
    { href: "/driver/profile", label: "Profile", icon: User },
];

export const adminLinks = [
    { href: "/admin", label: "Overview", icon: LayoutDashboard },
    { href: "/admin/rides", label: "Rides", icon: Route },
    { href: "/admin/drivers", label: "Drivers", icon: CarFront },
    { href: "/admin/riders", label: "Riders", icon: Users },
    { href: "/admin/pricing", label: "Pricing", icon: BadgePercent },
];

// Server layouts pass a variant name (icons can't cross the server/client boundary).
export type NavVariant = "rider" | "driver" | "admin";

export const navConfig = {
    rider: { home: "/dashboard", links: dashboardLinks },
    driver: { home: "/driver", links: driverLinks },
    admin: { home: "/admin", links: adminLinks },
} satisfies Record<NavVariant, unknown>;

export const isActivePath = (pathname: string, href: string, home: string) =>
    href === home ? pathname === href : pathname.startsWith(href);
