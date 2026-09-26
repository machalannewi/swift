import Input from "./Input";
import { MapboxFeature } from "@/types/mapbox";
import { useEffect, useState } from "react";
import { reverseGeocode } from "@/utils/mapbox";
import CarOptions from "./CarOptions";
import { RouteData } from "@/hooks/useMapboxRoute";
import { AnimatePresence, motion } from "framer-motion";
import { RideDTO } from "@/types/ride";

interface SearchBoxProps {
    onPickupSelect: (place: MapboxFeature | null) => void;
    onDropoffSelect: (place: MapboxFeature | null) => void;
    pickup: MapboxFeature | null;
    dropoff: MapboxFeature | null;
    route: RouteData | null;
    routeLoading: boolean;
    onRideRequested: (ride: RideDTO) => void;
}

export default function SearchBox({
    onPickupSelect,
    onDropoffSelect,
    pickup,
    dropoff,
    route,
    routeLoading,
    onRideRequested,
}: SearchBoxProps) {
    const [initialPickup, setInitialPickup] = useState<MapboxFeature | null>(
        null,
    );
    const [isLoadingLocation, setIsLoadingLocation] = useState<boolean>(true);
    const [userLocation, setUserLocation] = useState<[number, number] | null>(
        null,
    );
    const [userCountry, setUserCountry] = useState<string | null>(null);

    useEffect(() => {
        if (!navigator.geolocation) {
            console.error("Geolocation is not supported");
            setIsLoadingLocation(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { longitude, latitude } = position.coords;
                const coords: [number, number] = [longitude, latitude];

                setUserLocation(coords);

                const place = await reverseGeocode(longitude, latitude);

                if (place) {
                    setInitialPickup(place);
                    onPickupSelect(place);

                    // Extract country code from the place context
                    const countryContext = place.context?.find((c) =>
                        c.id.startsWith("country."),
                    );
                    if (countryContext?.short_code) {
                        setUserCountry(countryContext.short_code);
                    }
                }

                setIsLoadingLocation(false);
            },
            (error) => {
                console.error("Error getting location:", error);
                setIsLoadingLocation(false);
            },
        );
    }, [onPickupSelect]);

    return (
        <section className="bg-neutral-900 border border-white/10 rounded-3xl p-6">
            <h2 className="text-3xl font-medium">Get a ride</h2>
            <p className="text-white/50 mt-1">
                Where are you heading today?
            </p>

            <div className="relative mt-6">
                {/* Connector line between pickup and dropoff */}
                <div className="absolute left-[28px] top-[29px] bottom-[29px] w-px border-l border-dashed border-white/20 pointer-events-none" />
                <Input
                    placeholder={
                        isLoadingLocation
                            ? "Getting your location..."
                            : "Pickup location"
                    }
                    icon="pickup"
                    onPlaceSelect={onPickupSelect}
                    initialPlace={initialPickup}
                    userLocation={userLocation}
                    userCountry={userCountry}
                />
                <Input
                    placeholder="Where to?"
                    icon="dropoff"
                    className="mt-3"
                    onPlaceSelect={onDropoffSelect}
                    userLocation={userLocation}
                    userCountry={userCountry}
                />
            </div>

            <AnimatePresence mode="wait">
                {routeLoading && (
                    <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="mt-6 flex flex-col gap-3"
                    >
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div
                                key={i}
                                className="h-20 rounded-2xl bg-neutral-800 animate-pulse"
                            />
                        ))}
                    </motion.div>
                )}

                {route && !routeLoading && pickup && dropoff && (
                    <motion.div
                        key="options"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                    >
                        <CarOptions
                            // Reset the booking flow whenever the route changes
                            key={`${pickup.id}-${dropoff.id}`}
                            pickup={pickup}
                            dropoff={dropoff}
                            distance={route.distance}
                            duration={route.duration}
                            onRequested={onRideRequested}
                        />
                    </motion.div>
                )}

                {!route && !routeLoading && (
                    <motion.div
                        key="empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="mt-6 flex items-center gap-3 rounded-2xl border border-dashed border-white/15 p-4 text-white/50 text-sm"
                    >
                        <span className="bg-lime-400 text-neutral-950 size-5 rounded-full inline-flex items-center justify-center flex-shrink-0">
                            &#10038;
                        </span>
                        Enter a destination to see available rides and
                        upfront prices.
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}
