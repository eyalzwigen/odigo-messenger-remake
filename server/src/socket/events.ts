import { Server } from 'socket.io';
import type { ConnectedUsers } from '../lib/connectedUsers.ts';
import type { publicRoomsAvalible } from '../lib/publicRoomsAvalible.js';
import supabase from '../lib/supabase.js';
import type { User } from '../../../packages/shared/lib/user.ts';
import type { PublicRoom } from '../../../packages/shared/lib/room.js';
import { deleteRoom } from '../routes/rooms.js';
import type { SocketActiveLinks } from '../lib/siteLayeredRooms.js';

export function registerSocketEvents(
    io: Server,
    connectedUsers: ConnectedUsers,
    publicRooms: publicRoomsAvalible,
    socketActiveLinks: SocketActiveLinks
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
                    continue;
                }
                socket.leave(room);
            }

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

    socket.on("active_link", async (url: string, fullSite: boolean) => {
        console.log('raw url:', url);
        
        const link = fullSite ? new URL(url).hostname : url;
        console.log('computed link:', link);

        // add socket to active links for this url
        if (!socketActiveLinks.has(link)) {
            socketActiveLinks.set(link, new Set());
        }
        socketActiveLinks.get(link)!.add(socket.id);
        console.log('size after add:', socketActiveLinks.get(link)?.size);
        console.log('socket.id:', socket.id);

        // leave current rooms
        for (const room of socket.rooms) {
            if (room !== socket.id) socket.leave(room);
        }

        const activeSocketIds = socketActiveLinks.get(link)!;
        const validSocketIds = new Set<string>();

        // validate which sockets are still connected
        for (const socketId of activeSocketIds) {
            const sockets = await io.in(socketId).fetchSockets();
            if (sockets.length > 0) {
                validSocketIds.add(socketId);
            } else {
                activeSocketIds.delete(socketId);
            }
        }

        // not enough people on this page yet
        if (validSocketIds.size < 2) return;

        // create room if it doesn't exist
        if (!publicRooms.has(link)) {
            publicRooms.set(link, {
                roomId: link,
                members: [],
                messages: [],
                timeout: setTimeout(() => deleteRoom(link, io, publicRooms), 10 * 60 * 1000)
            });
        }

        const room = publicRooms.get(link)!;
        const messageHistory = room.messages ?? [];

        // join all valid sockets that aren't already in the room
        for (const socketId of validSocketIds) {
            const sockets = await io.in(socketId).fetchSockets();
            if (sockets.length === 0) continue;
            const s = sockets[0];

            if (!s?.rooms.has(link)) {
                s?.join(link);

                // add to members if not already there
                const alreadyMember = room.members.some((m: { m: any }) => m.id === s?.data.userId);
                if (!alreadyMember) {
                    room.members.push({
                        id: s?.data.userId,
                        username: s?.data.username
                    });
                }

                s?.emit('room_accepted', link, messageHistory);
            }
        }
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
                    room.members = room.members.filter((m: User) => m.id !== user.id);
                }

                // clean up socketActiveLinks
                for (const [link, socketIds] of socketActiveLinks) {
                    socketIds.delete(socket.id);
                    if (socketIds.size === 0) socketActiveLinks.delete(link);
                }
            }
        });

    });
}
