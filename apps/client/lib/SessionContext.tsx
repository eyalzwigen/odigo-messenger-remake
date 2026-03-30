'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from './supabase/client';
import type { Session } from '@supabase/supabase-js';
import { connectUser, disconnectUser, updateToken } from '@odigo/shared/lib/socket';
import { Socket } from 'socket.io-client';
import { setHost } from '@odigo/shared/lib/handlers/host';

type SessionContextType = {
    session: Session | null,
    socket: Socket | null  // ← add socket to context
}

const SessionContext = createContext<SessionContextType>({
    session: null,
    socket: null
});

export function SessionProvider({ children }: {children: any}) {
    const [session, setSession] = useState<Session | null>(null);
    const [socket, setSocket] = useState<Socket | null>(null);
    const [loading, setLoading] = useState(true);

    setHost(process.env.NEXT_PUBLIC_EXPRESS_SERVER_HOST ?? 'http://localhost:8080');

    useEffect(() => {
        const supabase = createClient();
        let socketCreated: boolean = false;

        supabase.auth.getSession().then(({ data }) => {
            setSession(data.session);
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            setSession(session);
            setLoading(false);

            if (session && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
                if (!socketCreated) {
                    socketCreated = true;
                    const newSocket = connectUser(session.access_token, () => {
                        console.log('Socket connected');
                    });
                    setSocket(newSocket);  // ← store socket in state
                }
                socket?.emit('leave_room');
            } else if (event === 'TOKEN_REFRESHED' && session) {
                updateToken(session.access_token);
            } else if (event === 'SIGNED_OUT') {
                disconnectUser();
                setSocket(null);
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
    return useContext(SessionContext).socket;  // ← new hook
}