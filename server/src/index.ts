import express from "express"; // Main server for the API developement
import { Server } from "socket.io"; // To enable WebSockets for the real-time features

const app = express();
const port: number = parseInt(process.env.EXPRESS_PORT ?? "8080");

const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

const io = new Server(server, {
  cors: {origin: "*"}
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("message", (message) => {
    console.log(message);
    io.emit('message', `${socket.id.substring(0, 2)} said ${message}`);
  });

});

