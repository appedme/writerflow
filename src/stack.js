import "server-only";

import { StackServerApp } from "@stackframe/stack";

// Initialize Stack server app with proper configuration
export const stackServerApp = new StackServerApp({
  tokenStore: "nextjs-cookie",
  projectId: process.env.NEXT_PUBLIC_STACK_PROJECT_ID,
  secretKey: process.env.STACK_SECRET_SERVER_KEY,
});
