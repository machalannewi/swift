"use client";

import Mapbox from "@/components/dashboard/Mapbox";
import SearchBox from "@/components/dashboard/SearchBox";
import ActiveRidePanel from "@/components/dashboard/ActiveRidePanel";
import Tag from "@/components/Tag";
import { useMemo, useState } from "react";
import { MapboxFeature } from "@/types/mapbox";
import { useMapboxRoute } from "@/hooks/useMapboxRoute";
import { useLiveRide } from "@/hooks/useLiveRide";
import { placeToFeature } from "@/utils/mapbox";
import { useUser } from "@clerk/nextjs";

export default function Dashboard() {
    const { user } = useUser();
    const [pickup, setPickup] = useState<MapboxFeature | null>(null);
    const [dropoff, setDropoff] = useState<MapboxFeature | null>(null);
    const { ride, setRide, driverLocation, isLoading } = useLiveRide();

    // While a ride exists, the map shows its saved pickup/dropoff.
    const ridePickup = useMemo(() => (ride ? placeToFeature(ride.pickup) : null), [ride?.id]);
    const rideDropoff = useMemo(() => (ride ? placeToFeature(ride.dropoff) : null), [ride?.id]);
    const mapPickup = ride ? ridePickup : pickup;
    const mapDropoff = ride ? rideDropoff : dropoff;

    const { route, isLoading: routeLoading } = useMapboxRoute(mapPickup, mapDropoff);

    return (
        <div className="container max-w-7xl">
            <div className="mt-4 lg:mt-8">
                <Tag>
                    {user?.firstName ? `Welcome back, ${user.firstName}` : "Welcome back"}
                </Tag>
                <h1 className="text-4xl md:text-6xl font-medium mt-4">
                    Go wherever,{" "}
                    <span className="text-lime-400">whenever</span>
                </h1>
            </div>

            <div className="mt-8 grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6 items-start">
                <div className="h-[45vh] lg:h-[calc(100vh-260px)] lg:min-h-[520px] lg:sticky lg:top-28 rounded-3xl overflow-hidden border border-white/10 bg-neutral-900">
                    <Mapbox
                        pickup={mapPickup}
                        dropoff={mapDropoff}
                        route={route}
                        driverLocation={ride?.driver ? driverLocation : null}
                    />
                </div>

                {isLoading ? (
                    <div className="h-80 rounded-3xl bg-neutral-900 border border-white/10 animate-pulse" />
                ) : ride ? (
                    <ActiveRidePanel
                        ride={ride}
                        driverLocation={driverLocation}
                        onChange={setRide}
                        onDone={() => {
                            setRide(null);
                            setDropoff(null);
                        }}
                    />
                ) : (
                    <SearchBox
                        onPickupSelect={setPickup}
                        onDropoffSelect={setDropoff}
                        pickup={pickup}
                        dropoff={dropoff}
                        route={route}
                        routeLoading={routeLoading}
                        onRideRequested={setRide}
                    />
                )}
            </div>
        </div>
    );
}
