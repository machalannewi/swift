"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import AuthForm, { AuthMode } from "./AuthForm";

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    mode: AuthMode;
    onSuccess?: () => void;
    className?: string;
}

export default function AuthModal({
    isOpen,
    onClose,
    mode,
    onSuccess,
    className,
}: AuthModalProps) {
    const [currentMode, setCurrentMode] = useState<AuthMode>(mode);

    useEffect(() => {
        if (isOpen) setCurrentMode(mode);
    }, [isOpen, mode]);

    useEffect(() => {
        if (!isOpen) return;
        const onKeyDown = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, [isOpen, onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        className="relative w-full max-w-md my-auto"
                        initial={{ opacity: 0, y: 40, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 40, scale: 0.96 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                    >
                        <button
                            onClick={onClose}
                            className="absolute top-5 right-5 z-10 p-2 rounded-full border border-white/15 text-white/70 hover:border-lime-400 hover:text-lime-400 transition"
                            aria-label="Close"
                        >
                            <X size={18} />
                        </button>
                        <AuthForm
                            key={currentMode}
                            mode={currentMode}
                            onModeChange={setCurrentMode}
                            onSuccess={() => {
                                onSuccess?.();
                                onClose();
                            }}
                            className={className}
                        />
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
