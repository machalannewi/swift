"use client";

import { useSignUp, useSignIn } from "@clerk/nextjs";
import { useState, FormEvent, InputHTMLAttributes } from "react";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { AnimatePresence, motion } from "framer-motion";
import { twMerge } from "tailwind-merge";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Button from "@/components/Button";
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from "@/components/ui/input-otp";
import { Spinner } from "@/components/ui/spinner";

export type AuthMode = "signin" | "signup";

interface AuthFormProps {
    mode: AuthMode;
    // When provided (e.g. inside the modal) mode switches happen in place
    // instead of navigating between /sign-in and /sign-up.
    onModeChange?: (mode: AuthMode) => void;
    onSuccess?: () => void;
    className?: string;
}

const getErrorMessage = (err: unknown) =>
    isClerkAPIResponseError(err)
        ? err.errors[0]?.longMessage || err.errors[0]?.message
        : "An unexpected error occurred";

export default function AuthForm({
    mode,
    onModeChange,
    onSuccess,
    className,
}: AuthFormProps) {
    const {
        isLoaded: signUpLoaded,
        signUp,
        setActive: setActiveSignUp,
    } = useSignUp();
    const {
        isLoaded: signInLoaded,
        signIn,
        setActive: setActiveSignIn,
    } = useSignIn();

    const [fullName, setFullName] = useState<string>("");
    const [username, setUsername] = useState<string>("");
    const [emailAddress, setEmailAddress] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [confirmPassword, setConfirmPassword] = useState<string>("");
    const [pendingVerification, setPendingVerification] =
        useState<boolean>(false);
    const [code, setCode] = useState<string>("");
    const [error, setError] = useState<string>("");
    const [notice, setNotice] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);

    const router = useRouter();

    const finish = () => {
        onSuccess?.();
        router.push("/dashboard");
    };

    const switchMode = (next: AuthMode) => {
        setError("");
        onModeChange?.(next);
    };

    const handleSignUp = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!signUpLoaded || isLoading) return;

        setError("");

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setIsLoading(true);

        // Split full name into first and last
        const nameParts = fullName.trim().split(" ");
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";

        try {
            await signUp.create({
                firstName,
                lastName,
                username,
                emailAddress,
                password,
            });
            await signUp.prepareEmailAddressVerification({
                strategy: "email_code",
            });
            setPendingVerification(true);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerify = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!signUpLoaded || isLoading) return;

        setIsLoading(true);
        setError("");

        try {
            const completeSignUp = await signUp.attemptEmailAddressVerification(
                { code },
            );

            if (completeSignUp.status === "complete") {
                await setActiveSignUp({
                    session: completeSignUp.createdSessionId,
                });
                finish();
            } else {
                setError("Verification incomplete. Please try again.");
            }
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendCode = async () => {
        if (!signUpLoaded || isLoading) return;
        setError("");
        try {
            await signUp.prepareEmailAddressVerification({
                strategy: "email_code",
            });
            setNotice(`A new code was sent to ${emailAddress}`);
        } catch (err) {
            setError(getErrorMessage(err));
        }
    };

    const handleSignIn = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!signInLoaded || isLoading) return;

        setIsLoading(true);
        setError("");

        try {
            const result = await signIn.create({
                identifier: emailAddress,
                password,
            });

            if (result.status === "complete") {
                await setActiveSignIn({ session: result.createdSessionId });
                finish();
            } else {
                setError("Sign-in incomplete. Please try again.");
            }
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogle = async () => {
        if (!signInLoaded || isLoading) return;
        setError("");
        try {
            await signIn.authenticateWithRedirect({
                strategy: "oauth_google",
                redirectUrl: "/sso-callback",
                redirectUrlComplete: "/dashboard",
            });
        } catch (err) {
            setError(getErrorMessage(err));
        }
    };

    const isSignUp = mode === "signup";
    const step = isSignUp
        ? pendingVerification
            ? "verify"
            : "signup"
        : "signin";

    const heading = {
        signin: { title: "Welcome", accent: "back", sub: "Log in to book your next ride." },
        signup: { title: "Create your", accent: "account", sub: "Join Swift and ride in minutes." },
        verify: { title: "Check your", accent: "email", sub: `We sent a 6-digit code to ${emailAddress}.` },
    }[step];

    return (
        <div
            className={twMerge(
                "bg-neutral-900 border border-white/10 rounded-3xl p-6 md:p-8 text-white",
                className,
            )}
        >
            <AnimatePresence mode="wait">
                <motion.div
                    key={step}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.25 }}
                >
                    <h1 className="text-3xl md:text-4xl font-medium">
                        {heading.title}{" "}
                        <span className="text-lime-400">{heading.accent}</span>
                    </h1>
                    <p className="text-white/50 mt-2">{heading.sub}</p>

                    {step === "signin" && (
                        <form onSubmit={handleSignIn} className="mt-8 flex flex-col gap-4">
                            <TextField
                                label="Email"
                                id="email"
                                type="email"
                                autoComplete="email"
                                placeholder="you@example.com"
                                required
                                value={emailAddress}
                                onChange={(e) => setEmailAddress(e.target.value)}
                                disabled={isLoading}
                            />
                            <TextField
                                label="Password"
                                id="password"
                                type="password"
                                autoComplete="current-password"
                                placeholder="••••••••"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={isLoading}
                            />
                            <div id="clerk-captcha" />
                            <ErrorMessage error={error} />
                            <Button type="submit" variant="primary" className="w-full mt-2" disabled={isLoading}>
                                {isLoading ? <Spinner /> : "Log in"}
                            </Button>
                            <Divider />
                            <GoogleButton onClick={handleGoogle} disabled={isLoading} />
                            <SwitchPrompt
                                prompt="Don't have an account?"
                                action="Sign up"
                                href="/sign-up"
                                onClick={onModeChange ? () => switchMode("signup") : undefined}
                            />
                        </form>
                    )}

                    {step === "signup" && (
                        <form onSubmit={handleSignUp} className="mt-8 flex flex-col gap-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <TextField
                                    label="Full name"
                                    id="name"
                                    autoComplete="name"
                                    placeholder="John Doe"
                                    required
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    disabled={isLoading}
                                />
                                <TextField
                                    label="Username"
                                    id="username"
                                    autoComplete="username"
                                    placeholder="johndoe10"
                                    required
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>
                            <TextField
                                label="Email"
                                id="email"
                                type="email"
                                autoComplete="email"
                                placeholder="you@example.com"
                                required
                                value={emailAddress}
                                onChange={(e) => setEmailAddress(e.target.value)}
                                disabled={isLoading}
                            />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <TextField
                                    label="Password"
                                    id="password"
                                    type="password"
                                    autoComplete="new-password"
                                    placeholder="8+ characters"
                                    minLength={8}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={isLoading}
                                />
                                <TextField
                                    label="Confirm password"
                                    id="confirm-password"
                                    type="password"
                                    autoComplete="new-password"
                                    placeholder="Repeat password"
                                    minLength={8}
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>
                            <div id="clerk-captcha" />
                            <ErrorMessage error={error} />
                            <Button type="submit" variant="primary" className="w-full mt-2" disabled={isLoading}>
                                {isLoading ? <Spinner /> : "Create account"}
                            </Button>
                            <Divider />
                            <GoogleButton onClick={handleGoogle} disabled={isLoading} />
                            <SwitchPrompt
                                prompt="Already have an account?"
                                action="Log in"
                                href="/sign-in"
                                onClick={onModeChange ? () => switchMode("signin") : undefined}
                            />
                        </form>
                    )}

                    {step === "verify" && (
                        <form onSubmit={handleVerify} className="mt-8 flex flex-col gap-4">
                            <InputOTP
                                maxLength={6}
                                id="otp"
                                required
                                value={code}
                                onChange={(value) => setCode(value)}
                                disabled={isLoading}
                                containerClassName="justify-center"
                            >
                                <InputOTPGroup className="gap-2">
                                    {Array.from({ length: 6 }).map((_, i) => (
                                        <InputOTPSlot
                                            key={i}
                                            index={i}
                                            className="size-12 text-lg rounded-2xl border border-white/15 bg-neutral-950 ring-lime-400 first:rounded-l-2xl last:rounded-r-2xl"
                                        />
                                    ))}
                                </InputOTPGroup>
                            </InputOTP>
                            <ErrorMessage error={error} />
                            {notice && !error && (
                                <p className="text-sm text-lime-400 text-center">{notice}</p>
                            )}
                            <Button
                                type="submit"
                                variant="primary"
                                className="w-full mt-2"
                                disabled={isLoading || code.length < 6}
                            >
                                {isLoading ? <Spinner /> : "Verify email"}
                            </Button>
                            <p className="text-center text-sm text-white/50">
                                Didn&apos;t receive the code?{" "}
                                <button
                                    type="button"
                                    onClick={handleResendCode}
                                    className="text-white hover:text-lime-400 transition"
                                >
                                    Resend
                                </button>
                            </p>
                        </form>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

function TextField({
    label,
    id,
    className,
    ...props
}: { label: string; id: string } & InputHTMLAttributes<HTMLInputElement>) {
    return (
        <div className="flex flex-col gap-2">
            <label htmlFor={id} className="text-sm font-medium text-white/70">
                {label}
            </label>
            <input
                id={id}
                className={twMerge(
                    "h-12 w-full rounded-full border border-white/15 bg-neutral-950 px-5 text-white placeholder:text-white/30 outline-none transition duration-300 focus:border-lime-400 disabled:opacity-50",
                    className,
                )}
                {...props}
            />
        </div>
    );
}

function ErrorMessage({ error }: { error: string }) {
    return (
        <AnimatePresence>
            {error && (
                <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-sm text-red-400 overflow-hidden"
                    role="alert"
                >
                    {error}
                </motion.p>
            )}
        </AnimatePresence>
    );
}

function Divider() {
    return (
        <div className="flex items-center gap-4 text-sm text-white/40">
            <span className="h-px flex-1 bg-white/10" />
            or
            <span className="h-px flex-1 bg-white/10" />
        </div>
    );
}

function GoogleButton({
    onClick,
    disabled,
}: {
    onClick: () => void;
    disabled?: boolean;
}) {
    return (
        <Button
            type="button"
            variant="secondary"
            className="w-full border-white/15 hover:border-white"
            onClick={onClick}
            disabled={disabled}
        >
            <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
                <path
                    d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                    fill="currentColor"
                />
            </svg>
            Continue with Google
        </Button>
    );
}

function SwitchPrompt({
    prompt,
    action,
    href,
    onClick,
}: {
    prompt: string;
    action: string;
    href: string;
    onClick?: () => void;
}) {
    const className = "text-lime-400 hover:text-lime-300 font-medium transition";
    return (
        <p className="text-center text-sm text-white/50 mt-2">
            {prompt}{" "}
            {onClick ? (
                <button type="button" onClick={onClick} className={className}>
                    {action}
                </button>
            ) : (
                <Link href={href} className={className}>
                    {action}
                </Link>
            )}
        </p>
    );
}
