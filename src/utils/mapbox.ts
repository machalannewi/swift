import { MapboxFeature } from '@/types/mapbox';

export async function reverseGeocode(
    longitude: number,
    latitude: number
): Promise<MapboxFeature | null> {
    try {
        const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
        if (!token) {
            throw new Error('Mapbox token not configured');
        }

        const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${token}&limit=1`
        );

        if (!response.ok) {
            throw new Error('Reverse geocoding failed');
        }

        const data = await response.json();

        if (data.features && data.features.length > 0) {
            return data.features[0] as MapboxFeature;
        }

        return null;
    } catch (error) {
        console.error('Error reverse geocoding:', error);
        return null;
    }
}