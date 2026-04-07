import { useState, useEffect, useRef } from 'react';
import '../../style.css';
import { SessionProvider, useSession, useSocket } from '../../lib/SessionContext';
import type { PublicMessage } from "@odigo/shared/lib/message";
import AuthView from '../../views/AuthView';
import ChatPage from '../../views/ChatView';

function AppContent() {
    const session = useSession();
    const [roomId, setRoomId] = useState<string | null>(null);
    const [fullMessages, setFullMessages] = useState<PublicMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const pendingRef = useRef<PublicMessage[]>([]);

    useEffect(() => {

        const loadFromStorage = async () => {
            const storedRoomId = await storage.getItem<string>('local:roomId');
            const storedMessages = await storage.getItem<PublicMessage[]>('local:messages');
            if (storedRoomId) {
                setRoomId(storedRoomId);
                setFullMessages(storedMessages ?? []);
                setLoading(false);
            }
        };
        const listener = (message: any) => {
            if (message.type === 'room_accepted') {
                loadFromStorage();
            }
            if (message.type === 'join_error') {
                setLoading(false);
            }
        };

        browser.runtime.onMessage.addListener(listener);
        return () => browser.runtime.onMessage.removeListener(listener); // ← cleanup
    }, []);

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

export default function App() {
    return (
        <SessionProvider>
            <div className="dark bg-background text-foreground overflow-hidden p-2">
                <AppContent />
            </div>
        </SessionProvider>
    );
}