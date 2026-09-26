"use client";

import Tag from "@/components/Tag";
import Button from "@/components/Button";
import LogoutButton from "@/components/LogoutButton";
import { useClerk, useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import Image from "next/image";
import { Mail, Phone, CalendarDays, Settings, CarFront, IdCard, ShieldCheck } from "lucide-react";

const detailIcons = { car: CarFront, id: IdCard, shield: ShieldCheck, phone: Phone };

export interface ExtraDetail {
    icon: keyof typeof detailIcons;
    label: string;
    value: string;
}

export default function ProfileView({
    badge,
    extraDetails = [],
}: {
    badge: string;
    extraDetails?: ExtraDetail[];
}) {
    const { user, isLoaded } = useUser();
    const { openUserProfile } = useClerk();

    if (!isLoaded || !user) {
        return (
            <div className="container max-w-5xl mt-8">
                <div className="h-64 rounded-3xl bg-neutral-900 animate-pulse" />
            </div>
        );
    }

    const details = [
        {
            icon: Mail,
            label: "Email",
            value: user.primaryEmailAddress?.emailAddress ?? "Not set",
        },
        ...(extraDetails.some((d) => d.icon === "phone")
            ? []
            : [
                  {
                      icon: Phone,
                      label: "Phone",
                      value: user.primaryPhoneNumber?.phoneNumber ?? "Not set",
                  },
              ]),
        {
            icon: CalendarDays,
            label: "Member since",
            value: user.createdAt
                ? user.createdAt.toLocaleDateString(undefined, {
                      month: "long",
                      year: "numeric",
                  })
                : "-",
        },
        ...extraDetails.map((d) => ({ ...d, icon: detailIcons[d.icon] })),
    ];

    return (
        <div className="container max-w-5xl">
            <div className="mt-4 lg:mt-8">
                <Tag>Profile</Tag>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-4 lg:grid-cols-3 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="md:col-span-2 lg:col-span-1 bg-neutral-900 border border-white/10 rounded-3xl p-8 flex flex-col items-center text-center"
                >
                    <motion.div
                        whileHover={{ scale: 1.05, rotate: 3 }}
                        className="size-28 rounded-full border-4 border-lime-400 p-1"
                    >
                        <Image
                            src={user.imageUrl}
                            alt="Profile"
                            width={112}
                            height={112}
                            className="rounded-full size-full object-cover"
                        />
                    </motion.div>
                    <h1 className="text-3xl font-medium mt-6">
                        {user.fullName || user.username}
                    </h1>
                    <div className="inline-flex mt-3 py-1 px-3 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full text-neutral-950 font-semibold text-sm">
                        {badge}
                    </div>
                    <div className="flex flex-col gap-3 mt-8 w-full">
                        <Button
                            variant="primary"
                            onClick={() => openUserProfile()}
                        >
                            <Settings size={18} /> Manage account
                        </Button>
                        <LogoutButton />
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="md:col-span-2 bg-neutral-900 border border-white/10 rounded-3xl p-8"
                >
                    <h2 className="text-3xl font-medium">
                        Account <span className="text-lime-400">details</span>
                    </h2>
                    <div className="mt-6 flex flex-col gap-3">
                        {details.map((detail) => {
                            const Icon = detail.icon;
                            return (
                                <div
                                    key={detail.label}
                                    className="flex items-center gap-4 p-4 rounded-2xl bg-neutral-950 border border-white/10 hover:scale-[1.02] transition duration-500 group"
                                >
                                    <span className="bg-lime-400 text-neutral-950 size-10 rounded-full inline-flex items-center justify-center flex-shrink-0 group-hover:rotate-12 transition duration-500">
                                        <Icon size={18} />
                                    </span>
                                    <div className="min-w-0">
                                        <p className="text-sm text-white/50">
                                            {detail.label}
                                        </p>
                                        <p className="font-medium truncate">
                                            {detail.value}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
