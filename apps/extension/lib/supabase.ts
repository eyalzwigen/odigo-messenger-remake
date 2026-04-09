// Supabase client for the browser extension.
// Uses the WXT environment variables (prefixed with WXT_) instead of the
// NEXT_PUBLIC_ variables used by the web client, since WXT has its own
// env variable convention.

import { createClient } from '@supabase/supabase-js'

/**
 * The Supabase client instance shared across the extension.
 * Configured with the anon/publishable key -- not the service role.
 */
export const supabase = createClient(
    import.meta.env.WXT_SUPABASE_URL!,
    import.meta.env.WXT_SUPABASE_PUBLISHABLE_KEY!
)
