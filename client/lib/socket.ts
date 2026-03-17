import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function connectUser(username: string, onConnected: () => void) {
    if (socket) {
        onConnected();
        return socket;
    }
    socket = io("ws://localhost:8080", {
        auth: {
            username: username
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
