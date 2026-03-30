import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { restoreSession, saveSession } from './session';
import type { Session } from '@supabase/supabase-js';
import { connectUser, disconnectUser, updateToken } from '@odigo/shared/lib/socket';
import type { Socket } from 'socket.io-client';
import { setHost } from '@odigo/shared/lib/handlers/host';

type SessionContextType = {
    session: Session | null,
    socket: Socket | null
}

const SessionContext = createContext<SessionContextType>({
    session: null,
    socket: null
});

export function SessionProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [socket, setSocket] = useState<Socket | null>(null);
    const [loading, setLoading] = useState(true);

    setHost(import.meta.env.WXT_EXPRESS_SERVER_HOST ?? 'http://localhost:8080');

    useEffect(() => {
        let socketCreated = false;

        restoreSession().then((restoredSession) => {
            if (restoredSession) {
                setSession(restoredSession); // ← restoredSession is a full Supabase Session object returned by setSession()
                
                if (!socketCreated) {
                    socketCreated = true;
                    const newSocket = connectUser(restoredSession.access_token, () => {
                        console.log('Socket connected');
                    });
                    setSocket(newSocket);
                }
            }
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            setSession(session);

            if (session && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
                if (event === 'SIGNED_IN') browser.runtime.sendMessage({type: 'user_logged_in'});

                if (!socketCreated) {
                    socketCreated = true;
                    const newSocket = connectUser(session.access_token, () => {
                        console.log('Socket connected');
                    });
                    setSocket(newSocket);
                }
            } else if (event === 'TOKEN_REFRESHED' && session) {
                updateToken(session.access_token);
                // save new tokens after refresh
                saveSession(session.access_token, session.refresh_token);
            } else if (event === 'SIGNED_OUT') {
                disconnectUser();
                setSocket(null);
                setSession(null);
                socketCreated = false;
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    if (loading) return null;

    return (
        <SessionContext.Provider value={{ session, socket }}>
            {children}
        </SessionContext.Provider>
    );
}

export function useSession() {
    return useContext(SessionContext).session;
}

export function useSocket() {
    return useContext(SessionContext).socket;
}