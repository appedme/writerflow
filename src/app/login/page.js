import LoginForm from "@/src/components/Auth/LoginForm";

export const metadata = {
    title: "Login - WriterFlow",
    description: "Log in to your WriterFlow account",
};

export default function LoginPage() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md">
                <LoginForm />
            </div>
        </main>
    );
}