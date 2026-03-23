import { Server } from 'socket.io';
import type { ConnectedUsers } from '../lib/connectedUsers.ts';
import type { publicRoomsAvalible } from '../lib/publicRoomsAvalible.js';
import supabase from '../lib/supabase.js';
import type { User } from '../../../shared/lib/user.ts';
import type { PublicRoom } from '../../../shared/lib/room.js';
import { deleteRoom } from '../routes/rooms.js';

export function registerSocketEvents(
    io: Server,
    connectedUsers: ConnectedUsers,
    publicRooms: publicRoomsAvalible
) {
    io.use(async (socket, next) => {
        const token = socket.handshake.auth.accessToken;
        if (!token) return next(new Error('Unauthorized'));

        const { data, error } = await supabase.auth.getUser(token);
        if (error) return next(new Error('Unauthorized'));

        socket.data.userId = data.user.id;
        socket.data.username = data.user.user_metadata.username;
        next();
    });

    io.of("/").adapter.on("delete-room", (room) => {
        publicRooms.delete(room);
    });

    io.on('connection', (socket) => {
        const user: User = {
            accessToken: socket.handshake.auth.accessToken,
            id: socket.data.userId,
            username: socket.data.username
        };

        if (!connectedUsers.has(user.id)) {
            connectedUsers.set(user.id, new Set());
        }
        console.log(publicRooms);
        for (const room of socket.rooms) socket.leave(room);

        connectedUsers.get(user.id)!.add(socket.id);

        socket.on('join_room', (roomId: string) => {
            console.log('join_room received:', roomId);
            console.log('room messages:', publicRooms.get(roomId)?.messages);

            if (!roomId) {
                socket.emit('join_error', 'No room id given');
                return;
            }

            if (!publicRooms.has(roomId)) {
                socket.emit('join_error', 'Room does not exist');
                return;
            }

            for (const room of socket.rooms) {
                if (room === roomId) {
                    socket.emit('joined_room', {roomId: roomId, messageHistory: []});
                    return;
                }
            }

            for (const room of socket.rooms) socket.leave(room);
            socket.join(roomId);
            publicRooms.get(roomId)?.members.push({
                id: socket.data.userId,
                username: socket.data.username
            });
            console.log({roomId: roomId, messageHistory: publicRooms.get(roomId)?.messages});
            socket.emit('joined_room', {roomId: roomId, messageHistory: publicRooms.get(roomId)?.messages});
        });

        socket.on('leave_room', () => {
            for (const room of socket.rooms) socket.leave(room);
        });

        socket.on('create_public_room', (roomId: string) => {
            if (!roomId) {
                socket.emit('public_room_creation_error', 'No room id given');
                return;
            }

            if (publicRooms.has(roomId)) {
                socket.emit('public_room_creation_error', 'Name is already used');
                return;
            }

            for (const room of socket.rooms) socket.leave(room);
            socket.join(roomId);
            publicRooms.set(roomId, {
                roomId: roomId,
                members: [{
                    id: socket.data.userId,
                    username: socket.data.username
                }],
                messages: [],
                timeout: setTimeout(() => deleteRoom(roomId, io, publicRooms), 10 * 60 * 1000)
            });
            socket.emit('public_room_created', roomId);
        });

        socket.on('message', ({ roomId, message }: { roomId: string, message: string }) => {
            const room: PublicRoom | undefined = publicRooms.get(roomId);
            if (room == undefined || !socket.rooms.has(roomId)) {
                socket.emit('message_error', `User is not connected to room: ${roomId}`);
                return;
            }

            if (room?.messages?.length === parseInt(process.env.MAX_MESSAGES_SAVED ?? '50')) {
                room.messages = room.messages?.slice(1);
            }

            room?.messages?.push({
                message: message,
                senderName: socket.data.username,
                roomId: roomId
            });
            
            io.to(roomId).emit('message', user.username, message);
        });

        socket.on('disconnect', () => {
            const sockets = connectedUsers.get(user.id);
            if (sockets) {
                sockets.delete(socket.id);
                if (sockets.size === 0) connectedUsers.delete(user.id);
                // remove from all public rooms
                for (const [roomName, room] of publicRooms) {
                    room.members = room.members.filter(m => m.id !== user.id);
                }
            }
        });

    });
}
