import { ShieldAlert } from "lucide-react";
import Tag from "@/components/Tag";
import LogoutButton from "@/components/LogoutButton";

export default function SuspendedScreen() {
    return (
        <div className="container max-w-2xl">
            <div className="mt-8 bg-neutral-900 border border-white/10 rounded-3xl p-8 md:p-12 text-center">
                <Tag>Account</Tag>
                <div className="mt-8 flex justify-center">
                    <span className="size-16 rounded-full bg-neutral-800 inline-flex items-center justify-center">
                        <ShieldAlert size={30} />
                    </span>
                </div>
                <h1 className="text-4xl font-medium mt-6">
                    Account <span className="text-lime-400">suspended</span>
                </h1>
                <p className="text-white/50 mt-4 max-w-md mx-auto">
                    Your Swift account has been suspended. Please contact support to
                    find out more.
                </p>
                <div className="mt-8 flex justify-center">
                    <LogoutButton />
                </div>
            </div>
        </div>
    );
}
