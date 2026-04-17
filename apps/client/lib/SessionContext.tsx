"use client";

// Provides session and socket state to the entire Next.js client app.
// Wraps the Supabase auth listener so any component can read the current
// session and the shared Socket.IO connection without prop-drilling.

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "./supabase/client";
import type { Session } from "@supabase/supabase-js";
import {
  connectUser,
  disconnectUser,
  updateToken,
} from "@odigo/shared/lib/socket";
import { Socket } from "socket.io-client";
import { setHost } from "@odigo/shared/lib/handlers/host";

/** The shape of the value provided by SessionContext */
type SessionContextType = {
  session: Session | null;
  socket: Socket | null; // add socket to context
};

const SessionContext = createContext<SessionContextType>({
  session: null,
  socket: null,
});

/**
 * Wraps children with a Supabase auth listener and a Socket.IO connection.
 *
 * On mount, retrieves the existing session (if any) and subscribes to
 * Supabase auth state changes.  A socket is created once on SIGNED_IN /
 * INITIAL_SESSION and destroyed on SIGNED_OUT.  Token refreshes are
 * forwarded to the existing socket so it does not need to reconnect.
 *
 * Renders nothing while the initial session check is in flight (loading).
 *
 * @param children - React subtree that will have access to the context
 */
export function SessionProvider({ children }: { children: any }) {
  const [session, setSession] = useState<Session | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [loading, setLoading] = useState(true);

  // Tell the shared library where the Express server lives
  setHost(
    process.env.NEXT_PUBLIC_EXPRESS_SERVER_HOST ?? "http://localhost:8080",
  );

  useEffect(() => {
    const supabase = createClient();

    // Prevents creating more than one socket per mount cycle
    let socketCreated: boolean = false;

    // Hydrate the initial session synchronously from the existing cookie
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setLoading(false);

      if (session && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
        if (!socketCreated) {
          socketCreated = true;
          const newSocket = connectUser(session.access_token, () => {
            console.log("Socket connected");
          });
          setSocket(newSocket); // store socket in state
        }
        // Leave any room from a previous session
        socket?.emit("leave_room");
      } else if (event === "TOKEN_REFRESHED" && session) {
        // Pass the new token to the socket without reconnecting
        updateToken(session.access_token);
      } else if (event === "SIGNED_OUT") {
        disconnectUser();
        setSocket(null);
        socketCreated = false;
      }
    });

    // Unsubscribe the Supabase listener when the component unmounts
    return () => subscription.unsubscribe();
  }, []);

  // Don't render children until we know whether there is a session --
  // avoids a flash of unauthenticated content
  if (loading) return null;

  return (
    <SessionContext.Provider value={{ session, socket }}>
      {children}
    </SessionContext.Provider>
  );
}

/**
 * Returns the current Supabase Session, or null if the user is not signed in.
 * Must be used inside a SessionProvider.
 */
export function useSession() {
  return useContext(SessionContext).session;
}

/**
 * Returns the active Socket.IO socket, or null if the user is not signed in.
 * Must be used inside a SessionProvider.
 */
export function useSocket() {
  return useContext(SessionContext).socket; // new hook
}
