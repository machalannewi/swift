import { Locate, LocateFixed, X } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useMapboxAutocomplete } from "@/hooks/useMapboxAutocomplete";
import { MapboxFeature } from "@/types/mapbox";
import { reverseGeocode } from "@/utils/mapbox";

interface InputProps {
    placeholder: string;
    className?: string;
    icon: "pickup" | "dropoff";
    onPlaceSelect?: (place: MapboxFeature | null) => void;
    initialPlace?: MapboxFeature | null;
    userLocation?: [number, number] | null;
    userCountry?: string | null;
}

export default function Input({
    placeholder,
    className,
    icon,
    onPlaceSelect,
    initialPlace,
    userLocation,
    userCountry,
}: InputProps) {
    const [isFocused, setIsFocused] = useState<boolean>(false);
    const [hasBeenCleared, setHasBeenCleared] = useState<boolean>(false);
    const [isGettingLocation, setIsGettingLocation] = useState<boolean>(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const { query, setQuery, suggestions, isLoading, selectPlace } =
        useMapboxAutocomplete(onPlaceSelect, userLocation, userCountry);

    useEffect(() => {
        if (initialPlace && !query && !hasBeenCleared) {
            setQuery(initialPlace.place_name);
        }
    }, [initialPlace, query, hasBeenCleared, setQuery]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent): void => {
            if (
                wrapperRef.current &&
                !wrapperRef.current.contains(event.target as Node)
            ) {
                setIsFocused(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelectPlace = (place: MapboxFeature): void => {
        selectPlace(place);
        setIsFocused(false);
        setHasBeenCleared(false);
    };

    const handleClear = (): void => {
        setQuery("");
        setIsFocused(false);
        setHasBeenCleared(true);
        if (onPlaceSelect) {
            onPlaceSelect(null);
        }
    };

    const handleGetCurrentLocation = async (): Promise<void> => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser");
            return;
        }

        setIsGettingLocation(true);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { longitude, latitude } = position.coords;

                try {
                    // Reverse geocode to get address from coordinates
                    const place = await reverseGeocode(longitude, latitude);

                    if (place) {
                        setQuery(place.place_name);
                        setHasBeenCleared(false);

                        // Notify parent component
                        if (onPlaceSelect) {
                            onPlaceSelect(place);
                        }
                    }
                } catch (error) {
                    console.error("Error getting location:", error);
                    alert("Failed to get your location");
                } finally {
                    setIsGettingLocation(false);
                }
            },
            (error) => {
                console.error("Geolocation error:", error);
                alert(
                    "Unable to retrieve your location. Please check your permissions.",
                );
                setIsGettingLocation(false);
            },
        );
    };

    return (
        <div ref={wrapperRef} className={twMerge("relative", className)}>
            <div
                className={twMerge(
                    "bg-neutral-950 border border-white/15 p-2 pr-3 rounded-full flex items-center gap-3 transition duration-300",
                    isFocused && "border-lime-400",
                )}
            >
                {/* Clickable Location Icon */}
                <button
                    onClick={handleGetCurrentLocation}
                    disabled={isGettingLocation}
                    className={twMerge(
                        "relative flex-shrink-0 size-10 inline-flex items-center justify-center rounded-full text-neutral-950 transition duration-300 hover:scale-110 disabled:opacity-50",
                        icon === "pickup"
                            ? "bg-lime-400"
                            : "bg-gradient-to-r from-purple-400 to-pink-400",
                    )}
                    type="button"
                    aria-label="Use current location"
                    title="Use current location"
                >
                    {icon === "pickup" ? (
                        <Locate
                            className={isGettingLocation ? "animate-pulse" : ""}
                            size={18}
                        />
                    ) : (
                        <LocateFixed
                            className={isGettingLocation ? "animate-pulse" : ""}
                            size={18}
                        />
                    )}
                </button>

                <input
                    type="text"
                    placeholder={placeholder}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    className="bg-transparent w-full min-w-0 outline-none text-white placeholder:text-white/40"
                />

                {/* Clear button */}
                {query && (
                    <button
                        onClick={handleClear}
                        className="flex-shrink-0 p-1 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition"
                        type="button"
                        aria-label="Clear input"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>

            {/* Suggestions Dropdown */}
            <AnimatePresence>
                {isFocused && suggestions.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="absolute z-20 w-full bg-neutral-900 border border-white/15 rounded-2xl mt-2 shadow-2xl max-h-60 overflow-y-auto p-1"
                    >
                        {suggestions.map((suggestion) => (
                            <div
                                key={suggestion.id}
                                onClick={() => handleSelectPlace(suggestion)}
                                className="p-3 rounded-xl hover:bg-neutral-800 cursor-pointer transition"
                            >
                                <p className="text-sm font-medium text-white">
                                    {suggestion.text}
                                </p>
                                <p className="text-xs text-white/50">
                                    {suggestion.place_name}
                                </p>
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Loading indicator */}
            {isFocused && isLoading && suggestions.length === 0 && (
                <div className="absolute z-20 w-full bg-neutral-900 border border-white/15 rounded-2xl mt-2 shadow-2xl p-3">
                    <p className="text-sm text-white/50">Searching...</p>
                </div>
            )}

            {/* Getting location indicator */}
            {isGettingLocation && (
                <div className="absolute z-20 w-full bg-neutral-900 border border-lime-400/40 rounded-2xl mt-2 shadow-2xl p-3">
                    <p className="text-sm text-lime-400">
                        Getting your location...
                    </p>
                </div>
            )}
        </div>
    );
}
