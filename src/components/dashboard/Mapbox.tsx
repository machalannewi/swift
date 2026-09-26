"use client";

import { useRef, useEffect, useState } from "react";
import ReactMapGL, {
    Marker,
    NavigationControl,
    MapRef,
    Source,
    Layer,
} from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { MapboxFeature } from "@/types/mapbox";
import { RouteData } from "@/hooks/useMapboxRoute";
import { Clock, Locate, Route } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface MapComponentProps {
    pickup: MapboxFeature | null;
    dropoff: MapboxFeature | null;
    route: RouteData | null;
}

// Lagos - used until the rider's location is known
const DEFAULT_CENTER = { longitude: 3.3792, latitude: 6.5244 };

export default function MapComponent({
    pickup,
    dropoff,
    route,
}: MapComponentProps) {
    const mapRef = useRef<MapRef>(null);
    const [currentLocation, setCurrentLocation] = useState<
        [number, number] | null
    >(null);
    const [locationError, setLocationError] = useState<string | null>(null);

    // Get user's current location
    const getCurrentLocation = (): void => {
        if (!navigator.geolocation) {
            setLocationError("Geolocation is not supported by your browser");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { longitude, latitude } = position.coords;
                setCurrentLocation([longitude, latitude]);
                setLocationError(null);

                // Fly to current location
                if (mapRef.current) {
                    mapRef.current.flyTo({
                        center: [longitude, latitude],
                        zoom: 14,
                        duration: 1000,
                    });
                }
            },
            (error) => {
                setLocationError("Unable to retrieve your location");
                console.error("Geolocation error:", error);
            },
        );
    };

    const getInitialViewState = () => {
        if (pickup) {
            return {
                longitude: pickup.center[0],
                latitude: pickup.center[1],
                zoom: 12,
            };
        }

        return { ...DEFAULT_CENTER, zoom: 10 };
    };

    // When pickup or dropoff changes, adjust the map view
    useEffect(() => {
        if (!mapRef.current || (!pickup && !dropoff)) return;

        const bounds: [number, number][] = [];

        if (pickup) bounds.push(pickup.center);
        if (dropoff) bounds.push(dropoff.center);

        if (bounds.length === 1) {
            mapRef.current.flyTo({
                center: bounds[0],
                zoom: 14,
                duration: 1000,
            });
        } else if (bounds.length === 2) {
            mapRef.current.fitBounds(
                [bounds[0], bounds[1]] as [[number, number], [number, number]],
                {
                    padding: 100,
                    duration: 1000,
                },
            );
        }
    }, [pickup, dropoff]);

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    if (!token) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <p className="text-white/50">Mapbox token not configured</p>
            </div>
        );
    }

    // Route line layer style - matches the landing page lime accent
    const routeLayerStyle = {
        id: "route",
        type: "line" as const,
        layout: {
            "line-cap": "round" as const,
            "line-join": "round" as const,
        },
        paint: {
            "line-color": "#a3e635",
            "line-width": 5,
            "line-opacity": 0.9,
        },
    };

    return (
        <div className="relative w-full h-full">
            <ReactMapGL
                ref={mapRef}
                initialViewState={getInitialViewState()}
                style={{ width: "100%", height: "100%" }}
                mapStyle="mapbox://styles/mapbox/dark-v11"
                mapboxAccessToken={token}
            >
                <NavigationControl position="top-right" />

                {/* Current Location Button */}
                <div className="absolute top-4 left-4 z-10">
                    <button
                        onClick={getCurrentLocation}
                        className="bg-neutral-950/80 backdrop-blur border border-white/15 p-3 rounded-full hover:border-lime-400 hover:text-lime-400 transition duration-300"
                        title="Get current location"
                        aria-label="Get current location"
                    >
                        <Locate size={20} />
                    </button>
                </div>

                {/* Route Line */}
                {route && (
                    <Source
                        id="route"
                        type="geojson"
                        data={{
                            type: "Feature",
                            properties: {},
                            geometry: {
                                type: "LineString",
                                coordinates: route.geometry.coordinates,
                            },
                        }}
                    >
                        <Layer {...routeLayerStyle} />
                    </Source>
                )}

                {/* Current Location Marker */}
                {currentLocation && (
                    <Marker
                        longitude={currentLocation[0]}
                        latitude={currentLocation[1]}
                        anchor="center"
                    >
                        <div className="relative size-4">
                            <div className="absolute inset-0 bg-lime-400 rounded-full animate-ping opacity-75" />
                            <div className="absolute inset-0 bg-lime-400 rounded-full border-2 border-neutral-950" />
                        </div>
                    </Marker>
                )}

                {/* Pickup Marker */}
                {pickup && (
                    <Marker
                        longitude={pickup.center[0]}
                        latitude={pickup.center[1]}
                        anchor="bottom"
                    >
                        <div className="inline-flex rounded-full rounded-bl-none font-bold text-sm bg-lime-400 text-neutral-950 px-3 py-1 shadow-lg">
                            Pickup
                        </div>
                    </Marker>
                )}

                {/* Dropoff Marker */}
                {dropoff && (
                    <Marker
                        longitude={dropoff.center[0]}
                        latitude={dropoff.center[1]}
                        anchor="bottom"
                    >
                        <div className="inline-flex rounded-full rounded-bl-none font-bold text-sm bg-gradient-to-r from-purple-400 to-pink-400 text-neutral-950 px-3 py-1 shadow-lg">
                            Dropoff
                        </div>
                    </Marker>
                )}
            </ReactMapGL>

            {/* Route Info Display */}
            <AnimatePresence>
                {route && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="absolute bottom-10 left-4 flex gap-2 z-10"
                    >
                        <div className="inline-flex items-center gap-2 bg-neutral-950/80 backdrop-blur border border-white/15 rounded-full px-4 py-2 text-sm font-medium">
                            <Route size={16} className="text-lime-400" />
                            {(route.distance / 1000).toFixed(1)} km
                        </div>
                        <div className="inline-flex items-center gap-2 bg-neutral-950/80 backdrop-blur border border-white/15 rounded-full px-4 py-2 text-sm font-medium">
                            <Clock size={16} className="text-lime-400" />
                            {Math.round(route.duration / 60)} min
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Location Error */}
            {locationError && (
                <div className="absolute top-20 left-4 bg-neutral-950/80 backdrop-blur border border-red-500/50 px-4 py-2 rounded-full z-10">
                    <p className="text-sm text-red-400">{locationError}</p>
                </div>
            )}
        </div>
    );
}
