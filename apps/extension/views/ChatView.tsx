import { joinRoom } from '@odigo/shared/lib/socket';
import PublicChat from '@odigo/ui/components/chat/PublicChat';
import { useState, useEffect, use } from 'react';
import type { PublicMessage } from '@odigo/shared/lib/message';
import { Socket } from 'socket.io-client';
import { useSocket } from '../lib/SessionContext';

export default function ChatPage({ roomId, messageHistory}: { roomId: string, messageHistory: PublicMessage[]}) {
    const socket: Socket = useSocket()!;



    const onRoomDeleted = () => {
        window.close
    }

    return <PublicChat roomId={roomId} pastMessages={messageHistory} onRoomDeleted={onRoomDeleted} socket={useSocket()!} />;
}