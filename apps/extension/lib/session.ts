import { supabase } from './supabase'
import { storage } from 'wxt/utils/storage';


type StoredSession = {
    access_token: string,
    refresh_token: string
}

export async function saveSession(access_token: string, refresh_token: string): Promise<void> {
    await storage.setItem('local:session', { access_token, refresh_token });
}

export async function getSession(): Promise<StoredSession | null> {
    return await storage.getItem<{ access_token: string, refresh_token: string }>('local:session');
}

export async function clearSession(): Promise<void> {
    await storage.removeItem('local:session');
}

export async function restoreSession() {
    const session = await getSession();
    if (!session) return null;

    const { data, error } = await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token
    });

    if (error) {
        await clearSession();
        return null;
    }

    if (data.session) {
        await saveSession(
            data.session.access_token,
            data.session.refresh_token
        );
    }

    return data.session;
}