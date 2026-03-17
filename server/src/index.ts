import express from "express"; // Main server for the API developement
import { Server } from "socket.io"; // To enable WebSockets for the real-time features
import type { Room } from "../../shared/lib/room.js";
import type { User } from '../../shared/lib/user.js';

const app = express();
const port: number = parseInt(process.env.EXPRESS_PORT ?? "8080");

const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

const io = new Server(server, {
  cors: {origin: "*"}
});

const connectedUsers = new Map<string, string>();

io.on("connection", (socket) => {

  const user = {
    socket_id: socket.id,
    username: socket.handshake.auth.username
  };
  connectedUsers.set(user.socket_id, user.username);

  console.log(`${user.username} has joined the chat.`);

  socket.on("message", (message) => {
    console.log(message);
    io.emit('message', user.username, message);
  });


  socket.on(`disconnect`, (reason) => {
    connectedUsers.delete(socket.id);
    console.log(`${user.username} has left the chat.`);
  });
});



/* //! Only after implementing database and authentication. Figure out what each part does, and how to implement user verification or some sht

io.use((socket, next) => {
    try {
        // Authentication logic
        if (!isValid(socket.handshake.auth)) {
            return next(new Error('Authentication failed'));
        }
        next();
    } catch (error) {
        next(error);
    }
});

*/

/**
 * Returns all active public rooms with their connected users.
 * Filters out the per-socket rooms that Socket.io creates automatically.
 */
app.get('/api/rooms', (req, res): void => {
  const rooms: Room[] = [];
  const raw_rooms = io.of('/').adapter.rooms;

  for (const [room_name, usersList] of raw_rooms) {
    if (connectedUsers.has(room_name)) continue; // skip socket-id rooms

    const users: User[] = [];
    for (const socket_id of usersList) {
      users.push({
        socket_id,
        username: connectedUsers.get(socket_id)!
      });
    }

    rooms.push({ name: room_name, users });
  }

  res.json(rooms);
});