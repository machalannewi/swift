"use client";

import Tag from "@/components/Tag";
import { useState } from "react";
import { twMerge } from "tailwind-merge";
import { AnimatePresence, motion } from "framer-motion";

const faqs = [
    {
        question: "How do I book a ride?",
        answer: "Simply open the app, enter your destination, choose your vehicle type, and confirm your pickup location. You'll be matched with a nearby driver in seconds.",
    },
    {
        question: "How is the fare calculated?",
        answer: "Fares are calculated based on distance, time, and demand. You'll always see the estimated fare before booking, so there are no surprises.",
    },
    {
        question: "Is it safe to ride alone?",
        answer: "Absolutely. All our drivers are background-checked and rated by riders. You can share your trip details with friends or family and track your route in real-time for added safety.",
    },
    {
        question: "Can I schedule a ride in advance?",
        answer: "Yes! You can schedule rides up to 30 days in advance. Perfect for airport trips, early morning commutes, or important appointments.",
    },
    {
        question: "What payment methods do you accept?",
        answer: "We accept credit cards, debit cards, mobile wallets, and cash. You can add and manage multiple payment methods in the app for quick checkout.",
    },
];

export default function Faqs() {
    const [selectedIndex, setSelectedIndex] = useState(0);
    return (
        <section className="py-24">
            <div className="container">
                <div className="flex justify-center">
                    <Tag>FAQs</Tag>
                </div>
                <h2 className="text-6xl font-medium mt-6 text-center max-w-xl mx-auto">
                    Questions? We&apos;ve got{" "}
                    <span className="text-lime-400">answers</span>
                </h2>
                <div className="mt-12 flex flex-col gap-6 max-w-xl mx-auto">
                    {faqs.map((faq, faqIndex) => {
                        return (
                            <div
                                key={faq.question}
                                className="bg-neutral-900 rounded-2xl border border-white/10 p-6"
                            >
                                <div
                                    className="flex justify-between items-center"
                                    onClick={() => setSelectedIndex(faqIndex)}
                                >
                                    <h3 className="font-medium">
                                        {faq.question}
                                    </h3>
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="24"
                                        height="24"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className={twMerge(
                                            "feather feather-plus text-lime-400 flex-shrink-0 transition duration-300",
                                            selectedIndex === faqIndex &&
                                                "rotate-45",
                                        )}
                                    >
                                        <line
                                            x1="12"
                                            y1="5"
                                            x2="12"
                                            y2="19"
                                        ></line>
                                        <line
                                            x1="5"
                                            y1="12"
                                            x2="19"
                                            y2="12"
                                        ></line>
                                    </svg>
                                </div>
                                <AnimatePresence>
                                    {selectedIndex === faqIndex && (
                                        <motion.div
                                            initial={{
                                                height: 0,
                                                marginTop: 0,
                                            }}
                                            animate={{
                                                height: "auto",
                                                marginTop: 24,
                                            }}
                                            exit={{
                                                height: 0,
                                                marginTop: 0,
                                            }}
                                            className={twMerge(
                                                "overflow-hidden",
                                            )}
                                        >
                                            <p className="text-white/50">
                                                {faq.answer}
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
