"use client";

import Button from "@/components/Button";
import Pointer from "@/components/Pointer";
import heroDesign from "@/assets/images/design-example-1.png";
import heroDesign2 from "@/assets/images/design-example-2.png";
import Image from "next/image";
import { easeInOut, motion, useAnimate } from "framer-motion";
import { useEffect } from "react";
import cursorYouImage from "@/assets/images/cursor-you.svg";
import { SignInButton } from "@clerk/nextjs";

export default function Hero() {
    const [leftDesignScope, leftDesignAnimate] = useAnimate();
    const [leftPointerScope, leftPointerAnimate] = useAnimate();
    const [rightDesignScope, rightDesignAnimate] = useAnimate();
    const [rightPointerScope, rightPointerAnimate] = useAnimate();

    useEffect(() => {
        // Left side animations
        const animateLeft = async () => {
            await leftDesignAnimate([
                [leftDesignScope.current, { opacity: 1 }, { duration: 0.5 }],
                [leftDesignScope.current, { y: 0, x: 0 }, { duration: 0.5 }],
            ]);

            await leftPointerAnimate([
                [leftPointerScope.current, { opacity: 1 }, { duration: 0.5 }],
                [
                    leftPointerScope.current,
                    { y: 0, x: -100 },
                    { duration: 0.5 },
                ],
                [
                    leftPointerScope.current,
                    { x: 0, y: [0, 16, 0] },
                    { duration: 0.5, ease: easeInOut },
                ],
            ]);

            // Inline bounce animation
            leftPointerAnimate(
                leftPointerScope.current,
                { y: [0, -20, 0] },
                { duration: 1.5, repeat: Infinity, ease: easeInOut },
            );
        };

        // Right side animations
        const animateRight = async () => {
            await rightDesignAnimate([
                [
                    rightDesignScope.current,
                    { opacity: 1, x: 0, y: 0 },
                    { duration: 0.5, delay: 2.5 },
                ],
            ]);

            await rightPointerAnimate([
                [
                    rightPointerScope.current,
                    { opacity: 1, x: 175, y: 0 },
                    { duration: 0.5 },
                ],
                [
                    rightPointerScope.current,
                    { x: 0, y: [0, 20, 0] },
                    { duration: 0.5 },
                ],
            ]);

            // Inline bounce animation
            rightPointerAnimate(
                rightPointerScope.current,
                { y: [0, -20, 0] },
                { duration: 1.5, repeat: Infinity, ease: easeInOut },
            );
        };

        animateLeft();
        animateRight();
    }, []);

    return (
        <section
            className="py-24 overflow-x-clip"
            style={{ cursor: `url(${cursorYouImage.src}), auto` }}
        >
            <div className="container relative">
                {/* Left Design */}
                <motion.div
                    drag
                    ref={leftDesignScope}
                    initial={{ opacity: 0, y: 100, x: -100 }}
                    className="absolute -left-32 top-10 hidden lg:block"
                >
                    <Image
                        src={heroDesign}
                        draggable="false"
                        alt="hero design 1"
                    />
                </motion.div>

                {/* Left Pointer */}
                <motion.div
                    ref={leftPointerScope}
                    initial={{ opacity: 0, y: 0, x: -200 }}
                    className="absolute left-56 top-96 hidden lg:block"
                >
                    <Pointer name="Driver" />
                </motion.div>

                {/* Right Design */}
                <motion.div
                    drag
                    ref={rightDesignScope}
                    initial={{ opacity: 0, x: 100, y: 100 }}
                    className="absolute -right-64 -top-16 hidden lg:block"
                >
                    <Image
                        src={heroDesign2}
                        draggable="false"
                        alt="hero design 2"
                    />
                </motion.div>

                {/* Right Pointer */}
                <motion.div
                    ref={rightPointerScope}
                    initial={{ opacity: 0, x: 275, y: 100 }}
                    className="absolute right-80 -top-4 hidden lg:block"
                >
                    <Pointer name="Rider" color="red" />
                </motion.div>

                {/* Badge */}
                <div className="flex justify-center">
                    <div className="inline-flex py-1 px-3 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full text-neutral-950 font-semibold">
                        ✨ Available in 10+ cities
                    </div>
                </div>

                {/* Heading */}
                <h1 className="text-6xl md:text-7xl lg:text-8xl font-medium text-center mt-6">
                    Get there fast,
                    <br /> Travel in comfort
                </h1>

                {/* Description */}
                <p className="text-center text-xl text-white/50 mt-8 max-w-2xl mx-auto">
                    Why wait? Book a ride in seconds and get to your destination
                    safely, comfortably, and on time, every time...With Swift,
                    you focus on what really matters
                </p>

                {/* Email Form */}
                <motion.div drag>
                    <form
                        draggable="false"
                        className="flex border border-white/15 rounded-full p-2 mt-8 max-w-lg mx-auto"
                    >
                        <input
                            type="email"
                            placeholder="Enter your email"
                            className="bg-transparent px-4 w-full"
                        />
                        <SignInButton>
                            <Button
                                type="submit"
                                variant="primary"
                                className="whitespace-nowrap"
                                size="sm"
                            >
                                Book Now
                            </Button>
                        </SignInButton>
                    </form>
                </motion.div>
            </div>
        </section>
    );
}
