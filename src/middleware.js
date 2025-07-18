import { NextResponse } from "next/server";
import { stackServerApp } from "./stack";

// Define protected routes that require authentication
const protectedRoutes = [
    "/dashboard",
    "/profile",
    "/write",
];

// Define routes that are only accessible to non-authenticated users
const authRoutes = [
    "/login",
    "/register",
];

// Define routes that require specific roles (for future use)
const roleProtectedRoutes = {
    "/admin": ["admin"],
};

export async function middleware(request) {
    const { pathname } = request.nextUrl;

    try {
        // Check if the user is authenticated
        const user = await stackServerApp.getUser({ request });
        const isAuthenticated = !!user;

        // Get session information for token validation
        const session = isAuthenticated ? await stackServerApp.getSession({ request }) : null;
        const isSessionValid = !!session && new Date(session.expiresAt) > new Date();

        // Check if the requested path is a protected route
        const isProtectedRoute = protectedRoutes.some(route =>
            pathname === route || pathname.startsWith(`${route}/`)
        );

        // Check if the requested path is an auth route (login/register)
        const isAuthRoute = authRoutes.some(route =>
            pathname === route || pathname.startsWith(`${route}/`)
        );

        // Check if the route requires specific roles
        const requiredRoles = Object.entries(roleProtectedRoutes).find(([route]) =>
            pathname === route || pathname.startsWith(`${route}/`)
        )?.[1];

        // Redirect authenticated users away from auth routes
        if (isAuthenticated && isSessionValid && isAuthRoute) {
            return NextResponse.redirect(new URL("/dashboard", request.url));
        }

        // Redirect unauthenticated users away from protected routes
        if ((!isAuthenticated || !isSessionValid) && isProtectedRoute) {
            // Store the original URL to redirect back after login
            const redirectUrl = new URL("/login", request.url);
            redirectUrl.searchParams.set("redirect", pathname);
            return NextResponse.redirect(redirectUrl);
        }

        // Check role-based access (for future use)
        if (requiredRoles && isAuthenticated && isSessionValid) {
            const userRoles = user.roles || [];
            const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));

            if (!hasRequiredRole) {
                return NextResponse.redirect(new URL("/dashboard", request.url));
            }
        }

        // Add user information to request headers for server components
        const response = NextResponse.next();
        if (isAuthenticated && isSessionValid) {
            response.headers.set("x-user-id", user.id);
            response.headers.set("x-user-email", user.email);
        }

        return response;
    } catch (error) {
        console.error("Middleware authentication error:", error);

        // If there's an error with authentication, clear the session and redirect to login
        if (protectedRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`))) {
            return NextResponse.redirect(new URL("/login", request.url));
        }

        return NextResponse.next();
    }
}

// Configure the middleware to run only on specific paths
export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - api routes
         * - static files (/_next, /images, /favicon.ico, etc.)
         */
        "/((?!api|_next/static|_next/image|images|favicon.ico).*)",
    ],
};