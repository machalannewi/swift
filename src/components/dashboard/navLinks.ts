import { Car, CircleHelp, Home, Route, User, Wallet } from "lucide-react";

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

// Server layouts pass a variant name (icons can't cross the server/client boundary).
export type NavVariant = "rider" | "driver";

export const navConfig = {
    rider: { home: "/dashboard", links: dashboardLinks },
    driver: { home: "/driver", links: driverLinks },
} satisfies Record<NavVariant, unknown>;

export const isActivePath = (pathname: string, href: string, home: string) =>
    href === home ? pathname === href : pathname.startsWith(href);
