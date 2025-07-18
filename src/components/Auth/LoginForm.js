"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/components/Hooks/useAuth";
import Button from "@/src/components/UI/Button";
import Input from "@/src/components/UI/Input";
import Link from "next/link";

export default function LoginForm() {
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [serverError, setServerError] = useState("");

    const router = useRouter();
    const { login } = useAuth();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: "" }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        // Email validation
        if (!formData.email.trim()) {
            newErrors.email = "Email is required";
        }

        // Password validation
        if (!formData.password) {
            newErrors.password = "Password is required";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        setServerError("");

        try {
            await login(formData.email, formData.password);
            router.push("/dashboard");
        } catch (error) {
            console.error("Login error:", error);
            setServerError(error.message || "Invalid email or password");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto p-6 bg-white dark:bg-dark rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-gray-100">
                Log In to Your Account
            </h2>

            {serverError && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                    {serverError}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <Input
                        label="Email Address"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        error={errors.email}
                        required
                    />
                </div>

                <div>
                    <Input
                        label="Password"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        error={errors.password}
                        required
                    />
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <input
                            id="remember-me"
                            name="remember-me"
                            type="checkbox"
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                            Remember me
                        </label>
                    </div>

                    <div className="text-sm">
                        <Link href="/forgot-password" className="text-blue-600 dark:text-blue-400 hover:underline">
                            Forgot your password?
                        </Link>
                    </div>
                </div>

                <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? "Logging in..." : "Log In"}
                </Button>
            </form>

            <p className="mt-4 text-center text-gray-600 dark:text-gray-400">
                Don't have an account?{" "}
                <Link href="/register" className="text-blue-600 dark:text-blue-400 hover:underline">
                    Register
                </Link>
            </p>
        </div>
    );
}