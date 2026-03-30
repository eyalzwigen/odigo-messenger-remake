import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
    import.meta.env.WXT_SUPABASE_URL!,
    import.meta.env.WXT_SUPABASE_PUBLISHABLE_KEY!
)