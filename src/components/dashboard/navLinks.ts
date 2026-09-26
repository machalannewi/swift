import { Car, CircleHelp, Home, User } from "lucide-react";

export const dashboardLinks = [
    { href: "/dashboard", label: "Book", icon: Home },
    { href: "/dashboard/rides", label: "My Rides", icon: Car },
    { href: "/dashboard/profile", label: "Profile", icon: User },
    { href: "/dashboard/info", label: "Help", icon: CircleHelp },
];
