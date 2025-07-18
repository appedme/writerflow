import RegisterForm from "@/src/components/Auth/RegisterForm";

export const metadata = {
    title: "Register - WriterFlow",
    description: "Create a new account on WriterFlow",
};

export default function RegisterPage() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md">
                <RegisterForm />
            </div>
        </main>
    );
}