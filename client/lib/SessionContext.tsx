'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from './supabase/client';
import type { Session } from '@supabase/supabase-js';

const SessionContext = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);

    useEffect(() => {
        const supabase = createClient();

        // get initial session from cookies — no network request
        supabase.auth.getSession().then(({ data }) => {
            setSession(data.session);
        });

        // keep session updated on login/logout/refresh
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    return (
        <SessionContext.Provider value={session}>
            {children}
        </SessionContext.Provider>
    );
}

export function useSession() {
    return useContext(SessionContext);
}