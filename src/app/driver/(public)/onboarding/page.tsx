import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import DriverOnboardingForm from "@/components/driver/DriverOnboardingForm";

export default async function DriverOnboardingPage() {
    const user = await getCurrentUser();
    if (!user) redirect("/driver/sign-in");
    if (user.role === "DRIVER") redirect("/driver");

    return <DriverOnboardingForm />;
}
