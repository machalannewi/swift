import AuthForm from "@/components/auth/AuthForm";

export default function DriverSignInPage() {
    return (
        <AuthForm
            mode="signin"
            audience="driver"
            redirectTo="/driver"
            signInHref="/driver/sign-in"
            signUpHref="/driver/sign-up"
        />
    );
}
