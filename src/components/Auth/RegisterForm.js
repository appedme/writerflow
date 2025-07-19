"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/components/Hooks/useAuth";
import Button from "@/src/components/UI/Button";
import Input from "@/src/components/UI/Input";
import Link from "next/link";
import { registerUser } from "@/src/lib/actions/users";
import { useUI } from "@/src/contexts/UIContext";

export default function RegisterForm() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [serverError, setServerError] = useState("");

    const router = useRouter();
    const { register } = useAuth();
    const { showToast } = useUI();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: "" }));
        }

        // Clear server error when user makes changes
        if (serverError) setServerError("");
    };

    const validateForm = () => {
        const newErrors = {};

        // Name validation
        if (!formData.name.trim()) {
            newErrors.name = "Name is required";
        }

        // Email validation
        if (!formData.email.trim()) {
            newErrors.email = "Email is required";
        } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)) {
            newErrors.email = "Invalid email address";
        }

        // Password validation
        if (!formData.password) {
            newErrors.password = "Password is required";
        } else if (formData.password.length < 8) {
            newErrors.password = "Password must be at least 8 characters";
        }

        // Confirm password validation
        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match";
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
            // First, validate the form data using our server action
            const formDataObj = new FormData();
            formDataObj.append("name", formData.name);
            formDataObj.append("email", formData.email);
            formDataObj.append("password", formData.password);
            formDataObj.append("confirmPassword", formData.confirmPassword);

            const result = await registerUser(formDataObj);

            if (!result.success) {
                setServerError(result.error);
                setIsSubmitting(false);
                return;
            }

            // If validation is successful, proceed with Stack authentication
            const user = await register(formData.email, formData.password, formData.name);

            // Show success toast
            showToast("Account created successfully! Redirecting to dashboard...", "success", 3000);

            // Redirect after a short delay to show the toast
            setTimeout(() => {
                router.push("/dashboard");
            }, 1000);
        } catch (error) {
            console.error("Registration error:", error);
            setServerError(error.message || "Failed to register. Please try again.");
            showToast(error.message || "Failed to register. Please try again.", "error", 5000);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto p-6 bg-white dark:bg-dark rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-gray-100">
                Create an Account
            </h2>

            {serverError && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                    {serverError}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <Input
                        label="Full Name"
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={handleChange}
                        error={errors.name}
                        required
                        placeholder="Enter your full name"
                    />
                </div>

                <div>
                    <Input
                        label="Email Address"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        error={errors.email}
                        required
                        placeholder="your.email@example.com"
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
                        placeholder="••••••••"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Password must be at least 8 characters long
                    </p>
                </div>

                <div>
                    <Input
                        label="Confirm Password"
                        name="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        error={errors.confirmPassword}
                        required
                        placeholder="••••••••"
                    />
                </div>

                <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? "Creating Account..." : "Register"}
                </Button>
            </form>

            <p className="mt-4 text-center text-gray-600 dark:text-gray-400">
                Already have an account?{" "}
                <Link href="/login" className="text-blue-600 dark:text-blue-400 hover:underline">
                    Log in
                </Link>
            </p>
        </div>
    );
}