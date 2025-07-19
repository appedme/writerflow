# Stack Authentication Integration

This document outlines how Stack authentication is integrated into the WriterFlow platform.

## Configuration

Stack authentication is configured using environment variables:

```
NEXT_PUBLIC_STACK_PROJECT_ID=your-stack-project-id
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=your-stack-publishable-key
STACK_SECRET_SERVER_KEY=your-stack-secret-key
```

These variables should be set in the `.env.local` file for local development and in the appropriate environment variables for production deployments.

## Components

### AuthProvider

The `AuthProvider` component (`src/components/Auth/AuthProvider.js`) is responsible for:

- Initializing the Stack client
- Managing user authentication state
- Providing authentication methods (login, register, logout)
- Handling session management and expiry
- Syncing user data with our database

Usage:

```jsx
import { AuthProvider } from "@/src/components/Auth/AuthProvider";

function App({ children }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}
```

### ProtectedRoute

The `ProtectedRoute` component (`src/components/Auth/ProtectedRoute.js`) is a client-side component that:

- Ensures users are authenticated before accessing protected content
- Redirects unauthenticated users to the login page
- Supports role-based access control

Usage:

```jsx
import ProtectedRoute from "@/src/components/Auth/ProtectedRoute";

function AdminPage() {
  return (
    <ProtectedRoute requiredRoles={["admin"]}>
      <AdminDashboard />
    </ProtectedRoute>
  );
}
```

## Middleware

The middleware (`src/middleware.js`) handles:

- Server-side authentication checks
- Protecting routes from unauthenticated access
- Redirecting users based on authentication status
- Role-based access control
- Adding user information to request headers for server components

## Authentication Flow

1. User visits the site
   - AuthProvider checks for existing session
   - If session exists, user is authenticated
   - If no session, user is unauthenticated

2. User attempts to access protected route
   - Middleware checks authentication status
   - If authenticated, access is granted
   - If unauthenticated, user is redirected to login

3. User logs in
   - Credentials are validated by Stack
   - Session is created and stored
   - User is redirected to the requested page or dashboard

4. User logs out
   - Session is destroyed
   - User is redirected to the home page

## Session Management

- Sessions are managed by Stack and stored in cookies
- The AuthProvider monitors session expiry
- Sessions are automatically refreshed when nearing expiration
- Invalid sessions trigger automatic logout

## User Data Synchronization

When a user authenticates, their basic profile information is synchronized with our database:

- User ID
- Name
- Email
- Profile image URL

This ensures that our application has the necessary user data for features like post authorship, comments, and user profiles.