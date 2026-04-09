// Root component for the extension side panel.
//
// Decides what to render based on session and room state:
//   - No session -> show AuthView so the user can log in
//   - Session + loading -> show "Finding room..." spinner
//   - Session + no room -> close the panel (no chat to show)
//   - Session + roomId -> show ChatPage with the room's message history

import { useState, useEffect, useRef } from 'react';
import '../../style.css';
import { SessionProvider, useSession, useSocket } from '../../lib/SessionContext';
import type { PublicMessage } from "@odigo/shared/lib/message";
import AuthView from '../../views/AuthView';
import ChatPage from '../../views/ChatView';

/**
 * Inner component that reads session / socket context and coordinates
 * between storage, runtime messages, and rendering.
 *
 * Listens for 'room_accepted' and 'join_error' runtime messages from the
 * background service worker and reads the persisted room ID and message
 * history from local storage to populate the chat view.
 */
function AppContent() {
    const session = useSession();
    const [roomId, setRoomId] = useState<string | null>(null);
    const [fullMessages, setFullMessages] = useState<PublicMessage[]>([]);
    const [loading, setLoading] = useState(true);

    // Buffer for messages that may arrive before the storage read completes.
    // Not currently consumed but reserved for future use.
    const pendingRef = useRef<PublicMessage[]>([]);

    useEffect(() => {

        /**
         * Reads the room ID and message history that the background service
         * worker wrote to local storage after receiving 'room_accepted'.
         */
        const loadFromStorage = async () => {
            const storedRoomId = await storage.getItem<string>('local:roomId');
            const storedMessages = await storage.getItem<PublicMessage[]>('local:messages');
            if (storedRoomId) {
                setRoomId(storedRoomId);
                setFullMessages(storedMessages ?? []);
                setLoading(false);
            }
        };

        /**
         * Handles runtime messages sent by the background service worker.
         * 'room_accepted' triggers a storage read to hydrate the chat view.
         * 'join_error' marks loading as complete so the panel can close itself.
         */
        const listener = (message: any) => {
            if (message.type === 'room_accepted') {
                loadFromStorage();
            }
            if (message.type === 'join_error') {
                setLoading(false);
            }
        };

        browser.runtime.onMessage.addListener(listener);
        return () => browser.runtime.onMessage.removeListener(listener); // cleanup
    }, []);

    // If loading finished and there is a session but no room was found,
    // there is nothing to show -- close the side panel.
    useEffect(() => {
        if (!loading && session && !roomId) {
            window.close();
        }
    }, [loading, session, roomId]);

    if (!session) return <AuthView />;
    if (loading) return (
        <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground text-sm">Finding room...</p>
        </div>
    );
    if (!roomId) return null;
    return <ChatPage roomId={roomId} messageHistory={fullMessages} />;
}

/**
 * Root component for the extension side panel.
 * Wraps AppContent in the SessionProvider so auth and socket state are
 * available throughout the panel.
 */
export default function App() {
    return (
        <SessionProvider>
            <div className="dark bg-background text-foreground overflow-hidden p-2">
                <AppContent />
            </div>
        </SessionProvider>
    );
}
