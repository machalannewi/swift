import "server-only";
import { HttpError } from "@/lib/auth";

/** Driving distance/duration between two points, computed on the server so fares can't be tampered with. */
export async function getDrivingRoute(
    from: { lat: number; lng: number },
    to: { lat: number; lng: number },
) {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) throw new HttpError(500, "Mapbox token not configured");

    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=false&access_token=${token}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new HttpError(502, "Could not calculate a route");

    const data = await res.json();
    const route = data.routes?.[0];
    if (!route) throw new HttpError(422, "No driving route between these places");

    return {
        distanceMeters: Math.round(route.distance as number),
        durationSeconds: Math.round(route.duration as number),
    };
}
