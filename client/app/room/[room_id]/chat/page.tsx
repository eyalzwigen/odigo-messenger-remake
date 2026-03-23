'use client';

import { joinRoom } from '@/lib/socket';
import PublicChat from '../../../../components/chat/PublicChat';
import { useRouter } from 'next/navigation';
import { useState, useEffect, use } from 'react';
import { PublicMessage } from '../../../../../shared/lib/message';
import { Socket } from 'socket.io-client';
import { useSocket } from '@/lib/SessionContext';

export default function ChatPage({ params }: { params: Promise<{ room_id: string }> }) {
    const resolvedParams = use(params);
    const roomId = resolvedParams.room_id;
    const router = useRouter();
    const socket: Socket = useSocket()!;
    const [joined, setJoined] = useState(false);
    const [isJoining, setIsJoining] = useState(false);
    const [pastMessages, setPastMessages] = useState<PublicMessage[]>([]);

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

                setPastMessages(messageHistory ?? []);
                setJoined(true);
            }

        };

        join();

        return;
    }, [roomId]);

    if (!joined) return <p>Joining room...</p>;
    return <PublicChat roomId={roomId} pastMessages={pastMessages} />;
}