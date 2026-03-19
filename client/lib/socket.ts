import 'dotenv'
import { io, Socket } from "socket.io-client";
import type { SocketData } from '../../shared/lib/socket'

let socket: Socket | null = null;

export function connectUser(accessToken: string, onConnected: () => void) {
    if (socket) {
        onConnected();
        return socket;
    }
    socket = io(process.env.EXPRESS_SERVER_HOST, {
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
    })

    return socket;
}

export function getSocket(): Socket {
    if (!socket) throw new Error('Socket not created yet. Please connect user first.');
    return socket;
}

export function sendMessage(message: string): void {
    getSocket().emit('message', message);
}
