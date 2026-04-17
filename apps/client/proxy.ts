// Next.js middleware file.
// Runs on the Edge runtime before every matched request so Supabase sessions
// can be refreshed and unauthenticated users can be redirected server-side
// before any page component renders.

import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

/**
 * Next.js middleware entry point.
 * Delegates to updateSession which handles cookie refresh and auth redirects.
 *
 * @param request - The incoming request from the Next.js runtime
 * @returns A response that either continues normally or redirects to /auth/login
 */
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

/** Route matching config for the middleware.
 *  Runs on all paths except Next.js internals and static assets.
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
