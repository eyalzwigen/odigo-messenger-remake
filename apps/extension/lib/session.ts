// Session persistence helpers for the browser extension.
//
// Extensions cannot rely on cookies the way a web app can, so session tokens
// are stored in WXT's local storage (chrome.storage.local under the hood).
// These helpers wrap that storage with typed read/write/clear operations and
// handle the Supabase session restore flow.

import { supabase } from './supabase'
import { storage } from 'wxt/utils/storage';


/**
 * The minimal session data persisted to local storage.
 * Storing only the tokens (not the full Session object) keeps the stored
 * data small and avoids persisting derived fields that Supabase recalculates.
 */
type StoredSession = {
    access_token: string,
    refresh_token: string
}

/**
 * Writes the current session tokens to extension local storage.
 * Call this after a successful login and after each token refresh.
 *
 * @param access_token - The Supabase JWT access token
 * @param refresh_token - The Supabase refresh token
 */
export async function saveSession(access_token: string, refresh_token: string): Promise<void> {
    await storage.setItem('local:session', { access_token, refresh_token });
}

/**
 * Reads the stored session tokens from extension local storage.
 *
 * @returns The stored tokens, or null if no session has been saved
 */
export async function getSession(): Promise<StoredSession | null> {
    return await storage.getItem<{ access_token: string, refresh_token: string }>('local:session');
}

/**
 * Removes the session tokens from extension local storage.
 * Called when a session restore fails (expired tokens) so stale data
 * is not retried on the next startup.
 */
export async function clearSession(): Promise<void> {
    await storage.removeItem('local:session');
}

/**
 * Attempts to restore a previously saved session.
 *
 * Reads the stored tokens, passes them to Supabase to validate and refresh
 * them if needed, then writes the (possibly refreshed) tokens back to storage.
 *
 * @returns The restored Supabase Session on success, or null if the stored
 *          tokens are missing or no longer valid
 */
export async function restoreSession() {
    const session = await getSession();
    if (!session) return null;

    // Ask Supabase to validate and potentially refresh the stored tokens
    const { data, error } = await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token
    });

    if (error) {
        // Tokens are invalid or expired -- discard them so we don't retry
        await clearSession();
        return null;
    }

    // Persist the (potentially refreshed) tokens for future startups
    if (data.session) {
        await saveSession(
            data.session.access_token,
            data.session.refresh_token
        );
    }

    return data.session;
}
