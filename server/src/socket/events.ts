import { Server } from 'socket.io'
import type { ConnectedUsers } from '../lib/connectedUsers.js';
import supabase from '../lib/supabase.js';
export function registerSocketEvents (
    io: Server,
    connectedUsers: ConnectedUsers
) {

    io.use(async (socket, next) => {
        const token = socket.handshake.auth.accessToken;
        if (!token) return next(new Error('Unauthorized'));

        const { data, error } = await supabase.auth.getUser(token);
        if (error) return next(new Error('Unauthorized'));

        // derive userId and username from the verified token
        // never from what the client sent
        socket.data.userId = data.user.id;
        socket.data.username = data.user.user_metadata.username;
        next();
    });

    io.on("connection", (socket) => {

        const user = {
            user_id: socket.handshake.auth.user_id,
            username: socket.handshake.auth.username,
            socket_id: socket.id,
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
}

