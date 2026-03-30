import express from "express";
import { Server } from "socket.io";
import { registerSocketEvents } from "./socket/events.js";
import roomsRouter from "./routes/rooms.js";
import type { ConnectedUsers } from "./lib/connectedUsers.js";
import { supabase, requireAuth } from "./lib/supabase.js";
import authRouter from "./routes/auth.js";
import cors from 'cors';
import type { publicRoomsAvalible } from "./lib/publicRoomsAvalible.js";
import type { SocketActiveLinks } from "./lib/siteLayeredRooms.js";

const app = express();
const port: number = parseInt(process.env.EXPRESS_PORT ?? "8080");

const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

export const io = new Server(server, {
    cors: {
        origin: (origin, callback) => {
            callback(null, true);
        },
        methods: ['GET', 'POST'],
        credentials: true
    }
});

const connectedUsers: ConnectedUsers = new Map();
const publicRooms: publicRoomsAvalible = new Map();
const socketActiveLinks: SocketActiveLinks = new Map();

app.use(cors({
    origin: (origin, callback) => {
        callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.use(express.json());

registerSocketEvents(io, connectedUsers, publicRooms, socketActiveLinks);
app.use('/api/auth', authRouter(supabase));
app.use('/api/rooms', requireAuth, roomsRouter(io, publicRooms));