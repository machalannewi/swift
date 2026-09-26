export interface MapboxFeature {
    id: string;
    type: string;
    place_type: string[];
    relevance: number;
    properties: {
        accuracy?: string;
        [key: string]: any;
    };
    text: string;
    place_name: string;
    center: [number, number]; // [longitude, latitude]
    geometry: {
        type: string;
        coordinates: [number, number];
    };
    context?: Array<{
        id: string;
        text: string;
        short_code?: string;
    }>;
}

export interface MapboxGeocodingResponse {
    type: string;
    query: string[];
    features: MapboxFeature[];
    attribution: string;
}