import AuthShell from "@/components/auth/AuthShell";

export default function DriverAuthLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return <AuthShell audience="driver">{children}</AuthShell>;
}
