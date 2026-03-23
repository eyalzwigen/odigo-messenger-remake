import 'dotenv/config';

import { io, Socket } from "socket.io-client";
import type { SocketMessage } from '../../shared/lib/socket'
import { error } from 'console';
import { PublicMessage } from '../../shared/lib/message';

let socket: Socket | null = null;

export type MessageData = {
    roomId: string,
    message: string
}

export function connectUser(accessToken: string, onConnected: () => void) {
    if (socket) {
        onConnected();
        return socket;
    }
    socket = io(process.env.NEXT_PUBLIC_EXPRESS_SERVER_HOST, {
        auth: {
            accessToken: accessToken
        }
    });

    socket.on('connect', () => {
        onConnected();
    });

    socket.on('connect_error', (error) => {
        alert(error);
        socket = null;
    });

    socket.on('disconnect', () => {
        isJoining = false;
        currentRoom = null;
    });
    
    return socket;
}

export function updateToken(newToken: string) {
    if (!socket) return;
    socket.auth = { accessToken: newToken };
    // no need to reconnect — auth is sent on next connection attempt
}

export function disconnectUser() {
    if (socket) socket.disconnect()
}


export function sendMessage(socket: Socket, {roomId, message}: MessageData): void {
    socket.emit('message', {roomId: roomId, message: message});
}

let currentRoom: string | null = null;

export async function createPublicRoom(socket: Socket, roomId: string): 
Promise<
    { createdRoomId: string, error: null } |
    { createdRoomId: null, error: string }
> {

    return new Promise((resolve) => {

        const timeout = setTimeout(() => {
            socket.off('public_room_created');
            socket.off('public_room_creation_error');
            resolve({ createdRoomId: null, error: 'Request timed out' });
        }, 5000); // 5 seconds

        socket.emit('create_public_room', roomId);

        socket.once('public_room_created', (createdRoomId: string) => {
            clearTimeout(timeout);
            currentRoom = createdRoomId;
            resolve({ createdRoomId: createdRoomId, error: null });
        });

        socket.once('public_room_creation_error', (error: string) => {
            clearTimeout(timeout);
            resolve({ createdRoomId: null, error });
        });
    });
}

let isJoining = false;

export async function joinRoom(socket: Socket, roomId: string): 
Promise<
    { joinedRoomId: string, messageHistory: PublicMessage[], error: null } |
    { joinedRoomId: null, messageHistory: null, error: string }
> {

    // already in this room
    if (currentRoom === roomId) return { joinedRoomId: roomId, messageHistory: [], error: null };
    
    // already joining, don't send another request
    if (isJoining) return { joinedRoomId: null, messageHistory: null, error: 'Already joining a room' };

    isJoining = true; // ← lock

    return new Promise((resolve) => {
        const pendingMessages: PublicMessage[] = [];

        socket.on('message', (senderName: string, message: string) => {
            pendingMessages.push({ senderName, message, roomId });
        });

        const timeout = setTimeout(() => {
            isJoining = false; // ← unlock on timeout
            socket.off('joined_room');
            socket.off('join_error');
            socket.off('message');
            resolve({ joinedRoomId: null, messageHistory: null, error: 'Request timed out' });
        }, 5000);

        socket.emit('join_room', roomId);

        socket.once('joined_room', ({ joinedRoomId, messageHistory }) => {
            clearTimeout(timeout);
            socket.off('message');
            isJoining = false; // ← unlock on success
            currentRoom = joinedRoomId;
            const fullHistory = [...(messageHistory ?? []), ...pendingMessages];
            resolve({ joinedRoomId, messageHistory: fullHistory, error: null });
        });

        socket.once('join_error', (error: string) => {
            clearTimeout(timeout);
            socket.off('message');
            isJoining = false; // ← unlock on error
            resolve({ joinedRoomId: null, messageHistory: null, error });
        });
    });
}

