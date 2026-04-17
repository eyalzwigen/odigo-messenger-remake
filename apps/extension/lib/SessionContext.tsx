// Session and socket context for the browser extension side panel.
// Mirrors the web client's SessionContext but uses WXT storage to restore
// sessions (extensions cannot rely on browser cookies) and notifies the
// background service worker when the user signs in.

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabase";
import { restoreSession, saveSession } from "./session";
import type { Session } from "@supabase/supabase-js";
import {
  connectUser,
  disconnectUser,
  updateToken,
} from "@odigo/shared/lib/socket";
import type { Socket } from "socket.io-client";
import { setHost } from "@odigo/shared/lib/handlers/host";

/** The shape of the value provided by SessionContext */
type SessionContextType = {
  session: Session | null;
  socket: Socket | null;
};

const SessionContext = createContext<SessionContextType>({
  session: null,
  socket: null,
});

/**
 * Wraps the extension side panel with session state and a Socket.IO connection.
 *
 * On mount, tries to restore a saved session from local storage.  Subscribes
 * to Supabase auth state changes to react to sign-in, sign-out, and token
 * refresh events.  Sends a 'user_logged_in' runtime message to the background
 * service worker so it can connect its own socket on sign-in.
 *
 * Renders nothing while the initial session check is in flight.
 *
 * @param children - React subtree that will have access to the context
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [loading, setLoading] = useState(true);

  // Tell the shared library where the Express server lives
  setHost(import.meta.env.WXT_EXPRESS_SERVER_HOST ?? "http://localhost:8080");

  useEffect(() => {
    // Guards against creating more than one socket per mount cycle
    let socketCreated = false;

    // Try to restore a session saved from a previous session
    restoreSession().then((restoredSession) => {
      if (restoredSession) {
        setSession(restoredSession); // restoredSession is a full Supabase Session object returned by setSession()

        if (!socketCreated) {
          socketCreated = true;
          const newSocket = connectUser(restoredSession.access_token, () => {
            console.log("Socket connected");
          });
          setSocket(newSocket);
        }
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);

      if (session && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
        // Tell the background service worker to connect its socket too
        if (event === "SIGNED_IN")
          browser.runtime.sendMessage({ type: "user_logged_in" });

        if (!socketCreated) {
          socketCreated = true;
          const newSocket = connectUser(session.access_token, () => {
            console.log("Socket connected");
          });
          setSocket(newSocket);
        }
      } else if (event === "TOKEN_REFRESHED" && session) {
        // Forward the new token to the socket without reconnecting
        updateToken(session.access_token);
        // save new tokens after refresh
        saveSession(session.access_token, session.refresh_token);
      } else if (event === "SIGNED_OUT") {
        disconnectUser();
        setSocket(null);
        setSession(null);
        socketCreated = false;
      }
    });

    // Unsubscribe the Supabase listener when the component unmounts
    return () => subscription.unsubscribe();
  }, []);

  // Don't render children until the initial session check is done
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
  return useContext(SessionContext).socket;
}
