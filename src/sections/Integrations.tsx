import Tag from "@/components/Tag";
import IntegrationColumn, { type FleetIcon } from "@/components/IntegrationColumn";

const integrations = [
    {
        name: "Economy",
        icon: "economy" as FleetIcon,
        description: "Affordable rides for everyday travel.",
    },
    {
        name: "Comfort",
        icon: "comfort" as FleetIcon,
        description:
            "Extra space and premium features for a better experience.",
    },
    {
        name: "Premium",
        icon: "premium" as FleetIcon,
        description: "Luxury vehicles for special occasions.",
    },
    {
        name: "XL",
        icon: "xl" as FleetIcon,
        description: "Spacious rides for groups up to 6 passengers.",
    },
    {
        name: "Green",
        icon: "green" as FleetIcon,
        description: "Eco-friendly electric and hybrid vehicles.",
    },
    {
        name: "Accessible",
        icon: "accessible" as FleetIcon,
        description: "Wheelchair-accessible vehicles for all riders.",
    },
];

export type IntegrationsType = typeof integrations;

export default function Integrations() {
    return (
        <section className="py-24 overflow-hidden">
            <div className="container">
                <div className="grid lg:grid-cols-2 items-center lg:gap-16">
                    <div>
                        <Tag>Our Fleet</Tag>
                        <h2 className="text-6xl font-medium mt-6">
                            A ride for every{" "}
                            <span className="text-lime-400">occasion</span>
                        </h2>
                        <p className="text-white/50 mt-4 text-lg">
                            From budget-friendly options to premium comfort, we
                            offer a variety of vehicles to match your needs and
                            budget for every journey
                        </p>
                    </div>
                    <div>
                        <div className="h-[400px] lg:h-[800px] mt-8 lg:mt-0 grid md:grid-cols-2 gap-4 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_10%,black_90%,transparent)]">
                            <IntegrationColumn integrations={integrations} />
                            <IntegrationColumn
                                integrations={integrations.slice().reverse()}
                                reverse
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
