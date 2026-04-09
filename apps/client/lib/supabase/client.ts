// Browser-side Supabase client utilities.
// These functions are safe to call from Client Components and from
// browser-side code in general.  Do not use them in Server Components
// or server actions -- use the server client from proxy.ts instead.

import { createBrowserClient } from '@supabase/ssr'

/**
 * Creates a new browser Supabase client configured with the public
 * environment variables.  A new instance is created on each call, but
 * Supabase SSR internally manages the cookie-based session.
 *
 * @returns A SupabaseClient configured for browser use
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
}

/**
 * Convenience helper that retrieves the current session's access token.
 * Returns null if the user is not signed in.
 *
 * @returns The JWT access token string, or null
 */
export async function getAccessToken(): Promise<string | null> {
  const { data } = await createClient().auth.getSession();
  return data.session?.access_token ?? null;
}
