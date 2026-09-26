import Tag from "@/components/Tag";
import Faqs from "@/sections/Faqs";
import { LifeBuoy, ShieldCheck, Share2 } from "lucide-react";

const safetyTips = [
    {
        icon: ShieldCheck,
        title: "Verified drivers",
        description:
            "Every Swift driver is background-checked and rated by riders after each trip.",
    },
    {
        icon: Share2,
        title: "Share your trip",
        description:
            "Send your live route to friends or family so they know when you arrive.",
    },
    {
        icon: LifeBuoy,
        title: "24/7 support",
        description:
            "Something wrong? Our support team is available around the clock.",
    },
];

export default function InfoPage() {
    return (
        <>
            <div className="container max-w-5xl">
                <div className="mt-4 lg:mt-8">
                    <Tag>Help &amp; Safety</Tag>
                    <h1 className="text-4xl md:text-6xl font-medium mt-4">
                        Ride with <span className="text-lime-400">confidence</span>
                    </h1>
                </div>

                <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {safetyTips.map((tip) => {
                        const Icon = tip.icon;
                        return (
                            <div
                                key={tip.title}
                                className="bg-neutral-900 border border-white/10 rounded-3xl p-6 hover:scale-[1.02] transition duration-500 group"
                            >
                                <span className="bg-lime-400 text-neutral-950 size-12 rounded-full inline-flex items-center justify-center group-hover:rotate-12 transition duration-500">
                                    <Icon size={22} />
                                </span>
                                <h2 className="text-2xl font-medium mt-6">
                                    {tip.title}
                                </h2>
                                <p className="text-white/50 mt-2">
                                    {tip.description}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>

            <Faqs />
        </>
    );
}
