import { useEffect, useRef, useState } from 'react';
import { MapboxFeature, MapboxGeocodingResponse } from '@/types/mapbox';

interface UseMapboxAutocompleteReturn {
    query: string;
    setQuery: (query: string) => void;
    suggestions: MapboxFeature[];
    isLoading: boolean;
    selectPlace: (place: MapboxFeature) => void;
}

export function useMapboxAutocomplete(
    onSelect?: (place: MapboxFeature) => void,
    userLocation?: [number, number] | null,
    userCountry?: string | null
): UseMapboxAutocompleteReturn {
    const [query, setQuery] = useState<string>('');
    const [suggestions, setSuggestions] = useState<MapboxFeature[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const abortControllerRef = useRef<AbortController | null>(null);

    useEffect(() => {
        if (query.length < 3) {
            setSuggestions([]);
            return;
        }

        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        abortControllerRef.current = new AbortController();

        const searchPlaces = async (): Promise<void> => {
            setIsLoading(true);
            try {
                const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
                if (!token) {
                    throw new Error('Mapbox token is not configured');
                }

                let url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&autocomplete=true&limit=5`;
                
                if (userLocation) {
                    // Add proximity to bias towards user location
                    url += `&proximity=${userLocation[0]},${userLocation[1]}`;
                    
                    // Add bounding box - restrict to ~50km radius
                    const offset = 0.5;
                    const bbox = [
                        userLocation[0] - offset,
                        userLocation[1] - offset,
                        userLocation[0] + offset,
                        userLocation[1] + offset
                    ].join(',');
                    url += `&bbox=${bbox}`;
                }
                
                // Add country filter if available
                if (userCountry) {
                    url += `&country=${userCountry}`;
                }

                const response = await fetch(url, { 
                    signal: abortControllerRef.current!.signal 
                });
                
                if (!response.ok) {
                    throw new Error(`Mapbox API error: ${response.status}`);
                }

                const data: MapboxGeocodingResponse = await response.json();
                setSuggestions(data.features || []);
            } catch (error) {
                if (error instanceof Error && error.name !== 'AbortError') {
                    console.error('Error fetching suggestions:', error);
                    setSuggestions([]);
                }
            } finally {
                setIsLoading(false);
            }
        };

        const timeoutId = setTimeout(searchPlaces, 300);

        return () => {
            clearTimeout(timeoutId);
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [query, userLocation, userCountry]);

    const selectPlace = (place: MapboxFeature): void => {
        setQuery(place.place_name);
        setSuggestions([]);
        if (onSelect) {
            onSelect(place);
        }
    };

    return {
        query,
        setQuery,
        suggestions,
        isLoading,
        selectPlace,
    };
}