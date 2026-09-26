import AuthShell from "@/components/auth/AuthShell";

export default function AuthLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return <AuthShell audience="rider">{children}</AuthShell>;
}
