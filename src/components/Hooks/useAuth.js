"use client";

import { useAuth as useAuthFromProvider } from "@/src/components/Auth/AuthProvider";

// Re-export the hook for convenience
export const useAuth = useAuthFromProvider;