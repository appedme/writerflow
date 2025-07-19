"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { StackClient } from "@stackframe/stack/client";
import { createOrUpdateUser } from "@/src/lib/actions/users";
import { useRouter } from "next/navigation";

// Initialize Stack client with environment variables
const stackClient = new StackClient({
    projectId: process.env.NEXT_PUBLIC_STACK_PROJECT_ID,
    publishableKey: process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY,
});

// Create auth context
export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sessionExpiry, setSessionExpiry] = useState(null);
    const router = useRouter();

    useEffect(() => {
        // Check if user is already authenticated
        const checkAuth = async () => {
            try {
                const currentUser = await stackClient.getUser();

                if (currentUser) {
                    // Sync user with our database
                    const userData = {
                        name: currentUser.name || "",
                        email: currentUser.email || "",
                        imageUrl: currentUser.imageUrl || "",
                    };

                    await createOrUpdateUser(currentUser.id, userData);
                    setUser(currentUser);

                    // Get session information
                    const session = await stackClient.getSession();
                    if (session) {
                        setSessionExpiry(new Date(session.expiresAt));
                    }
                }
            } catch (error) {
                console.error("Authentication error:", error);
            } finally {
                setLoading(false);
            }
        };

        checkAuth();

        // Set up auth state listener
        const unsubscribe = stackClient.onAuthStateChange((event, session) => {
            if (event === "SIGNED_IN" && session?.user) {
                setUser(session.user);
                setSessionExpiry(new Date(session.expiresAt));

                // Sync user with our database
                const userData = {
                    name: session.user.name || "",
                    email: session.user.email || "",
                    imageUrl: session.user.imageUrl || "",
                };

                createOrUpdateUser(session.user.id, userData);
            } else if (event === "SIGNED_OUT") {
                setUser(null);
                setSessionExpiry(null);
            }
        });

        return () => {
            unsubscribe?.();
        };
    }, []);

    // Set up session expiry check
    useEffect(() => {
        if (!sessionExpiry) return;

        const checkSessionExpiry = () => {
            const now = new Date();
            const timeUntilExpiry = sessionExpiry.getTime() - now.getTime();

            // If session is about to expire in the next 5 minutes, refresh it
            if (timeUntilExpiry > 0 && timeUntilExpiry < 5 * 60 * 1000) {
                refreshSession();
            }

            // If session has expired, log out
            if (timeUntilExpiry <= 0) {
                logout();
            }
        };

        const interval = setInterval(checkSessionExpiry, 60 * 1000); // Check every minute
        return () => clearInterval(interval);
    }, [sessionExpiry]);

    const login = async (email, password) => {
        try {
            const { user, session } = await stackClient.signInWithPassword({ email, password });
            if (session) {
                setSessionExpiry(new Date(session.expiresAt));
            }
            return user;
        } catch (error) {
            console.error("Login error:", error);
            throw error;
        }
    };

    const register = async (email, password, name) => {
        try {
            // Attempt to register the user with Stack
            const { user, session } = await stackClient.signUp({
                email,
                password,
                name,
                // You can add additional user metadata here if needed
                userMetadata: {
                    registeredAt: new Date().toISOString(),
                }
            });

            if (session) {
                setSessionExpiry(new Date(session.expiresAt));
            }

            // Sync user with our database
            // This is handled by the onAuthStateChange listener,
            // but we'll also do it here to ensure immediate consistency
            if (user) {
                const userData = {
                    name: user.name || name,
                    email: user.email || email,
                    imageUrl: user.imageUrl || "",
                };

                await createOrUpdateUser(user.id, userData);
            }

            return user;
        } catch (error) {
            console.error("Registration error:", error);

            // Provide more user-friendly error messages
            if (error.message?.includes("already exists")) {
                throw new Error("An account with this email already exists. Please log in instead.");
            } else if (error.message?.includes("password")) {
                throw new Error("Password doesn't meet security requirements. Please use a stronger password.");
            } else {
                throw error;
            }
        }
    };

    const logout = async () => {
        try {
            await stackClient.signOut();
            router.push('/'); // Redirect to home page after logout
        } catch (error) {
            console.error("Logout error:", error);
            throw error;
        }
    };

    const refreshSession = async () => {
        try {
            const { session } = await stackClient.refreshSession();
            if (session) {
                setSessionExpiry(new Date(session.expiresAt));
            }
            return session;
        } catch (error) {
            console.error("Session refresh error:", error);
            throw error;
        }
    };

    // Function to require authentication for protected routes
    const requireAuth = (callback) => {
        if (loading) {
            return null; // Still loading, don't do anything yet
        }

        if (!user) {
            router.push('/login'); // Redirect to login if not authenticated
            return null;
        }

        return callback();
    };

    const value = {
        user,
        loading,
        login,
        register,
        logout,
        refreshSession,
        requireAuth,
        isAuthenticated: !!user,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};