"use client";

import { useAuth } from "@/src/components/Hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * A component wrapper that ensures the user is authenticated
 * before rendering the wrapped component.
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - The components to render if authenticated
 * @param {string} [props.redirectTo="/login"] - Where to redirect if not authenticated
 * @param {Array<string>} [props.requiredRoles] - Optional roles required to access the route
 * @returns {React.ReactNode} The protected component or null during redirect
 */
export default function ProtectedRoute({
    children,
    redirectTo = "/login",
    requiredRoles = []
}) {
    const { user, loading, isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // Wait until auth state is determined
        if (loading) return;

        // Redirect if not authenticated
        if (!isAuthenticated) {
            router.push(redirectTo);
            return;
        }

        // Check for required roles if specified
        if (requiredRoles.length > 0) {
            const userRoles = user?.roles || [];
            const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));

            if (!hasRequiredRole) {
                router.push("/dashboard");
            }
        }
    }, [isAuthenticated, loading, redirectTo, requiredRoles, router, user]);

    // Show nothing while loading or redirecting
    if (loading || !isAuthenticated) {
        return null;
    }

    // If roles are required, check if user has at least one of them
    if (requiredRoles.length > 0) {
        const userRoles = user?.roles || [];
        const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));

        if (!hasRequiredRole) {
            return null;
        }
    }

    // User is authenticated and has required roles, render children
    return children;
}