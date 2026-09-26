import { HttpError } from "@/lib/auth";

export async function readJson(req: Request): Promise<Record<string, unknown>> {
    try {
        const body = await req.json();
        if (body && typeof body === "object") return body as Record<string, unknown>;
    } catch {}
    throw new HttpError(400, "Invalid JSON body");
}

export function requireString(value: unknown, field: string, max = 300): string {
    if (typeof value !== "string" || !value.trim()) {
        throw new HttpError(400, `${field} is required`);
    }
    return value.trim().slice(0, max);
}

export function requireCoords(value: unknown, field: string) {
    const v = value as { lat?: unknown; lng?: unknown } | null;
    const lat = Number(v?.lat);
    const lng = Number(v?.lng);
    if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lng) ||
        Math.abs(lat) > 90 ||
        Math.abs(lng) > 180
    ) {
        throw new HttpError(400, `${field} must have valid lat/lng`);
    }
    return { lat, lng };
}
