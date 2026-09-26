import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";

const inter = Inter({
    variable: "--font-inter",
    subsets: ["latin"],
    display: "swap",
    axes: ["opsz"],
});

export const metadata: Metadata = {
    title: "Swift - Get there fast",
    description: "Book a ride in seconds and travel in comfort.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <ClerkProvider>
            <html lang="en">
                <body
                    className={`${inter.variable} font-sans antialiased bg-neutral-950 text-white`}
                >
                    {children}
                </body>
            </html>
        </ClerkProvider>
    );
}
