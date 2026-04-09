// Entry point for the Odigo Express server.
// Spins up the HTTP server, attaches Socket.IO, wires together middleware,
// and mounts all API routers.

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

// Read port from environment, fall back to 8080 for local dev
const port: number = parseInt(process.env.EXPRESS_PORT ?? "8080");

const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

// Attach Socket.IO to the same HTTP server so both REST and WebSocket
// traffic share a single port.
export const io = new Server(server, {
    cors: {
        // Allow every origin — tighten this in production if needed
        origin: (origin, callback) => {
            callback(null, true);
        },
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// In-memory stores — these live for the lifetime of the process.
// They are passed by reference into routers and socket handlers so
// all parts of the server share the same state.

/** Maps userId -> Set of socket IDs for that user. */
const connectedUsers: ConnectedUsers = new Map();

/** Maps roomId -> PublicRoom for every currently active public room. */
const publicRooms: publicRoomsAvalible = new Map();

/** Maps a URL string -> Set of socket IDs currently on that URL. */
const socketActiveLinks: SocketActiveLinks = new Map();

// CORS for REST endpoints.  Same permissive policy as Socket.IO above.
app.use(cors({
    origin: (origin, callback) => {
        callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// Parse JSON request bodies before any route handler runs
app.use(express.json());

// Register all socket event listeners
registerSocketEvents(io, connectedUsers, publicRooms, socketActiveLinks);

// Mount REST routers
app.use('/api/auth', authRouter(supabase));

//! roomsRouter is called with (io, publicRooms) but the function signature
//! only accepts (publicRooms). This means io is bound as the publicRooms
//! parameter, and the actual publicRooms map is silently ignored.
//! See server/src/routes/rooms.ts for the function definition.
app.use('/api/rooms', requireAuth, roomsRouter(io, publicRooms));
