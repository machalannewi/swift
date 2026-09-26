import AuthForm from "@/components/auth/AuthForm";

export default function DriverSignUpPage() {
    return (
        <AuthForm
            mode="signup"
            audience="driver"
            redirectTo="/driver/onboarding"
            signInHref="/driver/sign-in"
            signUpHref="/driver/sign-up"
        />
    );
}
