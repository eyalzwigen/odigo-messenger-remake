import { io } from "socket.io-client";

export const socket = io("ws://localhost:8080");

export function SendMessage(message: string): void {
    socket.emit('message', message);
}
