import { useState, useEffect } from 'react';
import { MapboxFeature } from '@/types/mapbox';

interface RouteGeometry {
    type: 'LineString';
    coordinates: [number, number][];
}

export interface RouteData {
    geometry: RouteGeometry;
    distance: number;
    duration: number;
    location: string;
}

export function useMapboxRoute(
    pickup: MapboxFeature | null,
    dropoff: MapboxFeature | null
) {
    const [route, setRoute] = useState<RouteData | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!pickup || !dropoff) {
            setRoute(null);
            return;
        }

        const fetchRoute = async (): Promise<void> => {
            setIsLoading(true);
            setError(null);

            try {
                const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
                if (!token) {
                    throw new Error('Mapbox token not configured');
                }

                const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${pickup.center[0]},${pickup.center[1]};${dropoff.center[0]},${dropoff.center[1]}?geometries=geojson&access_token=${token}`;

                const response = await fetch(url);
                
                if (!response.ok) {
                    throw new Error('Failed to fetch route');
                }

                const data = await response.json();

                if (data.routes && data.routes.length > 0) {
                    setRoute({
                        geometry: data.routes[0].geometry as RouteGeometry,
                        distance: data.routes[0].distance,
                        duration: data.routes[0].duration,
                        location: data.waypoints[1].name,
                    });
                } else {
                    setError('No route found');
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error');
                console.error('Error fetching route:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRoute();
    }, [pickup, dropoff]);

    return { route, isLoading, error };
}