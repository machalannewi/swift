import { Clock, ShieldAlert, XCircle } from "lucide-react";
import Tag from "@/components/Tag";
import LogoutButton from "@/components/LogoutButton";

const screens = {
    PENDING: {
        icon: Clock,
        title: "Application",
        accent: "under review",
        body: "Thanks for signing up to drive with Swift. We're checking your details and will activate your account shortly.",
    },
    REJECTED: {
        icon: XCircle,
        title: "Application",
        accent: "not approved",
        body: "We couldn't approve your driver application. Please contact support if you think this is a mistake.",
    },
    SUSPENDED: {
        icon: ShieldAlert,
        title: "Account",
        accent: "suspended",
        body: "Your driver account is suspended. Please contact support to find out more.",
    },
};

export default function DriverStatusScreen({
    status,
}: {
    status: keyof typeof screens;
}) {
    const { icon: Icon, title, accent, body } = screens[status];
    return (
        <div className="container max-w-2xl">
            <div className="mt-8 bg-neutral-900 border border-white/10 rounded-3xl p-8 md:p-12 text-center">
                <Tag>Driver account</Tag>
                <div className="mt-8 flex justify-center">
                    <span className="size-16 rounded-full bg-lime-400 text-neutral-950 inline-flex items-center justify-center">
                        <Icon size={30} />
                    </span>
                </div>
                <h1 className="text-4xl font-medium mt-6">
                    {title} <span className="text-lime-400">{accent}</span>
                </h1>
                <p className="text-white/50 mt-4 max-w-md mx-auto">{body}</p>
                <div className="mt-8 flex justify-center">
                    <LogoutButton />
                </div>
            </div>
        </div>
    );
}
