import express from "express"; // Main server for the API developement
import { Server } from "socket.io"; // To enable WebSockets for the real-time features
import { registerSocketEvents } from "./socket/events.js";
import roomsRouter from "./routes/rooms.js";
import type { ConnectedUsers } from "./lib/connectedUsers.js";
import { supabase, requireAuth } from "./lib/supabase.js";
import authRouter from "./routes/auth.js";
import cors from 'cors';
import type { PublicRoom } from "../../shared/lib/room.js";
import type { publicRoomsAvalible } from "./lib/publicRoomsAvalible.js";


const app = express();
const port: number = parseInt(process.env.EXPRESS_PORT ?? "8080");

const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export const io = new Server(server, {
  cors: { //TODO: Change for security reasons
    origin: "*",
    methods: ['GET', 'POST']
  }
});

const connectedUsers : ConnectedUsers = new Map();
const publicRooms: publicRoomsAvalible = new Map();

app.use(cors({
    origin: '*', // tighten this later
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

registerSocketEvents(io, connectedUsers, publicRooms);
app.use('/api/auth', authRouter(supabase));
app.use('/api/rooms', requireAuth, roomsRouter(io, publicRooms));