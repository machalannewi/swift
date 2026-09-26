"use client";

import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Button from "@/components/Button";
import { useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import { LogOut } from "lucide-react";

interface LogoutButtonProps {
    variant?: "primary" | "secondary";
    className?: string;
}

export default function LogoutButton({
    variant = "secondary",
    className,
}: LogoutButtonProps) {
    const { signOut } = useClerk();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const handleLogout = async () => {
        setIsLoading(true);

        try {
            await signOut();
            router.push("/");
        } catch (error) {
            console.error("Error signing out:", error);
            setIsLoading(false);
        }
    };

    return (
        <Button
            onClick={handleLogout}
            disabled={isLoading}
            variant={variant}
            className={className}
        >
            {isLoading ? (
                <Spinner />
            ) : (
                <>
                    <LogOut size={18} /> Logout
                </>
            )}
        </Button>
    );
}
