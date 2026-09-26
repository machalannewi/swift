import "server-only";
import { auth, currentUser } from "@clerk/nextjs/server";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import type { Role } from "@/generated/prisma/client";

/**
 * Returns the database user for the signed-in Clerk user, creating it on
 * first visit. Returns null when nobody is signed in.
 */
export const getCurrentUser = cache(async () => {
    const { userId } = await auth();
    if (!userId) return null;

    const existing = await prisma.user.findUnique({
        where: { clerkId: userId },
        include: { driverProfile: true },
    });
    if (existing) return existing;

    const clerkUser = await currentUser();
    return prisma.user.upsert({
        where: { clerkId: userId },
        update: {},
        create: {
            clerkId: userId,
            email: clerkUser?.primaryEmailAddress?.emailAddress,
            name:
                clerkUser?.fullName ||
                clerkUser?.username ||
                clerkUser?.firstName ||
                null,
            imageUrl: clerkUser?.imageUrl,
        },
        include: { driverProfile: true },
    });
});

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

export class HttpError extends Error {
    constructor(
        public status: number,
        message: string,
    ) {
        super(message);
    }
}

/** For route handlers: throws a 401/403 HttpError instead of redirecting. */
export async function requireUser(...roles: Role[]): Promise<CurrentUser> {
    const user = await getCurrentUser();
    if (!user) throw new HttpError(401, "Not signed in");
    if (user.suspendedAt && user.role !== "ADMIN") {
        throw new HttpError(403, "This account is suspended");
    }
    if (roles.length && !roles.includes(user.role)) {
        throw new HttpError(403, "Not allowed");
    }
    return user;
}

/** For route handlers: an approved driver with a profile. */
export async function requireApprovedDriver() {
    const user = await requireUser("DRIVER");
    if (!user.driverProfile || user.driverProfile.status !== "APPROVED") {
        throw new HttpError(403, "Driver account is not approved");
    }
    return { ...user, driverProfile: user.driverProfile };
}

/** Wraps a route handler so HttpErrors become JSON responses. */
export function handle<Args extends unknown[]>(
    fn: (...args: Args) => Promise<Response>,
) {
    return async (...args: Args): Promise<Response> => {
        try {
            return await fn(...args);
        } catch (err) {
            if (err instanceof HttpError) {
                return Response.json({ error: err.message }, { status: err.status });
            }
            console.error(err);
            return Response.json({ error: "Something went wrong" }, { status: 500 });
        }
    };
}
