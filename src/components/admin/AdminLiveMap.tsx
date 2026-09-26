"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ReactMapGL, { Marker, NavigationControl, type MapRef } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { CarFront } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { useChannelEvent } from "@/hooks/useChannelEvent";
import { channels, events } from "@/lib/realtime";
import { api } from "@/lib/api-client";
import { getCar } from "@/utils/CarListData";

type LiveDriver = {
    userId: string;
    name: string | null;
    carTier: string;
    plateNumber: string;
    lat: number;
    lng: number;
    onTrip: boolean;
};

const REFRESH_MS = 15_000;

export default function AdminLiveMap() {
    const mapRef = useRef<MapRef>(null);
    const [drivers, setDrivers] = useState<LiveDriver[]>([]);
    const [selected, setSelected] = useState<string | null>(null);
    const fitted = useRef(false);

    const load = useCallback(async () => {
        try {
            const { drivers } = await api<{ drivers: LiveDriver[] }>("/api/admin/drivers/live");
            setDrivers(drivers);
            if (!fitted.current && drivers.length && mapRef.current) {
                fitted.current = true;
                const lngs = drivers.map((d) => d.lng);
                const lats = drivers.map((d) => d.lat);
                mapRef.current.fitBounds(
                    [
                        [Math.min(...lngs) - 0.02, Math.min(...lats) - 0.02],
                        [Math.max(...lngs) + 0.02, Math.max(...lats) + 0.02],
                    ],
                    { padding: 60, duration: 800, maxZoom: 14 },
                );
            }
        } catch (err) {
            console.error("Failed to load live drivers", err);
        }
    }, []);

    useEffect(() => {
        load();
        const timer = setInterval(load, REFRESH_MS);
        return () => clearInterval(timer);
    }, [load]);

    useChannelEvent(channels.admin, events.driverUpdated, load);
    useChannelEvent(channels.admin, events.rideUpdated, load);

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    const onTrip = drivers.filter((d) => d.onTrip).length;
    const selectedDriver = drivers.find((d) => d.userId === selected);

    return (
        <div>
            <div className="flex flex-wrap items-center gap-4 mb-3 text-sm text-white/70">
                <span className="inline-flex items-center gap-2">
                    <span className="size-3 rounded-full bg-lime-400" /> Available ·{" "}
                    <span className="text-white tabular-nums">{drivers.length - onTrip}</span>
                </span>
                <span className="inline-flex items-center gap-2">
                    <span className="size-3 rounded-full bg-pink-400" /> On a trip ·{" "}
                    <span className="text-white tabular-nums">{onTrip}</span>
                </span>
            </div>
            <div className="relative h-80 rounded-2xl overflow-hidden border border-white/10">
                {token ? (
                    <ReactMapGL
                        ref={mapRef}
                        initialViewState={{ longitude: 3.3792, latitude: 6.5244, zoom: 9 }}
                        style={{ width: "100%", height: "100%" }}
                        mapStyle="mapbox://styles/mapbox/dark-v11"
                        mapboxAccessToken={token}
                        onLoad={load}
                    >
                        <NavigationControl position="top-right" showCompass={false} />
                        {drivers.map((d) => (
                            <Marker key={d.userId} longitude={d.lng} latitude={d.lat} anchor="center">
                                <button
                                    type="button"
                                    onClick={() => setSelected(d.userId === selected ? null : d.userId)}
                                    className={twMerge(
                                        "size-8 rounded-full border-2 border-neutral-950 text-neutral-950 inline-flex items-center justify-center shadow-lg transition hover:scale-110",
                                        d.onTrip ? "bg-pink-400" : "bg-lime-400",
                                    )}
                                    aria-label={`${d.name ?? "Driver"}${d.onTrip ? " (on a trip)" : ""}`}
                                >
                                    <CarFront size={16} />
                                </button>
                            </Marker>
                        ))}
                    </ReactMapGL>
                ) : (
                    <div className="h-full flex items-center justify-center text-white/50">
                        Mapbox token not configured
                    </div>
                )}

                {selectedDriver && (
                    <div className="absolute bottom-3 left-3 right-3 sm:right-auto rounded-2xl border border-white/15 bg-neutral-950/90 backdrop-blur px-4 py-3 text-sm">
                        <p className="font-medium">{selectedDriver.name ?? "Driver"}</p>
                        <p className="text-white/50">
                            {getCar(selectedDriver.carTier)?.name} · {selectedDriver.plateNumber} ·{" "}
                            {selectedDriver.onTrip ? "On a trip" : "Available"}
                        </p>
                    </div>
                )}

                {drivers.length === 0 && token && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <p className="rounded-full bg-neutral-950/80 px-4 py-2 text-sm text-white/60">
                            No drivers online right now
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
