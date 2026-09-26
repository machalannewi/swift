import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import { Spinner } from "@/components/ui/spinner";

// Landing spot for OAuth (Google) redirects - Clerk finishes the sign-in here.
export default function SSOCallbackPage() {
    return (
        <div className="min-h-svh flex flex-col items-center justify-center gap-4 bg-neutral-950 text-white">
            <Spinner />
            <p className="text-white/50">Signing you in...</p>
            <div id="clerk-captcha" />
            <AuthenticateWithRedirectCallback />
        </div>
    );
}
