import { handle, requireUser } from "@/lib/auth";
import { getAllPricing } from "@/lib/pricing";

// Current rates and surge for every tier, used to show riders upfront quotes.
export const GET = handle(async () => {
    await requireUser();
    return Response.json({ pricing: await getAllPricing() });
});
