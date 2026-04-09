'use client';

// Chat page for a specific public room.
// Joins the room identified by the [room_id] URL segment, loads message
// history, and renders the PublicChat UI component.

import { joinRoom } from '@odigo/shared/lib/socket';
import PublicChat from '../../../../../../packages/ui/src/components/chat/PublicChat';
import { useRouter } from 'next/navigation';
import { useState, useEffect, use } from 'react';
import { PublicMessage } from '../../../../../../packages/shared/lib/message';
import { Socket } from 'socket.io-client';
import { useSocket } from '@/lib/SessionContext';

/**
 * The /room/[room_id]/chat page.
 *
 * Resolves the dynamic room_id param, joins the socket room, and displays
 * the chat UI once joined.  Shows a loading indicator while the join is
 * in progress.
 *
 * @param params - Next.js dynamic route params (Promise in React 19 / Next 15)
 */
export default function ChatPage({ params }: { params: Promise<{ room_id: string }> }) {
    const resolvedParams = use(params);
    const roomId = resolvedParams.room_id;

    const router = useRouter();
    const socket: Socket = useSocket()!;

    const [joined, setJoined] = useState(false);
    const [isJoining, setIsJoining] = useState(false);
    const [pastMessages, setPastMessages] = useState<PublicMessage[]>([]);

    /** Redirects to the public rooms list when the server deletes the current room */
    const onRoomDeleted = () => {
        router.push('/rooms/public');
    }

    useEffect(() => {
        if (!roomId) return;

        const join = async () => {
            if (!isJoining) {
                setIsJoining(true);
                const { joinedRoomId, messageHistory, error } = await joinRoom(socket, roomId);
                console.trace('joinRoom()');

                if (error) {
                    console.log(error);
                    return;
                }

                // Store message history and mark the room as joined so the
                // chat UI renders
                setPastMessages(messageHistory ?? []);
                setJoined(true);
            }

        };

        join();

        return;
    }, [roomId]);

    if (!joined) return <p>Joining room...</p>;
    return <PublicChat roomId={roomId} pastMessages={pastMessages} onRoomDeleted={onRoomDeleted} socket={useSocket()!} />;
}
