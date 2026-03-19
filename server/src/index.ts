import express from "express"; // Main server for the API developement
import { Server } from "socket.io"; // To enable WebSockets for the real-time features
import { registerSocketEvents } from "./socket/events.js";
import roomsRouter from "./routes/rooms.js";
import type { ConnectedUsers } from "./lib/connectedUsers.js";
import { supabase, requireAuth } from "./lib/supabase.js";
import authRouter from "./routes/auth.js";

const app = express();
const port: number = parseInt(process.env.EXPRESS_PORT ?? "8080");

const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

const io = new Server(server, {
  cors: {origin: "*"} //TODO: Change for security reasons
});

const connectedUsers : ConnectedUsers = new Map();

app.use(express.json());
app.use(requireAuth)

registerSocketEvents(io, connectedUsers);
app.use('/api/rooms', roomsRouter(io, connectedUsers));
app.use('/api/auth', authRouter(supabase));