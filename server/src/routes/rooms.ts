import { Server } from 'socket.io';
import { Router } from 'express';
import type { PublicRoom } from '../../../packages/shared/lib/room.js'
import { CreateRoomRequestBodySchema } from '../../../packages/shared/lib/zodSchemas.js';
import { createPrivateRoom } from '../db/rooms.js';
import type { publicRoomsAvalible } from '../lib/publicRoomsAvalible.js';

export default function roomsRouter (
    publicRooms: publicRoomsAvalible
) {

    const router = Router();

    /**
     * Returns all active public rooms with their connected users.
     * Filters out the per-socket rooms that Socket.io creates automatically.
     * Doesn't search database becasue public rooms aren't saved in the database
     */ 
    router.get('/fetch/public', async (req, res): Promise<void> => {
        const rooms: PublicRoom[] = [];

        for (const [roomName, roomObject] of publicRooms) {
            const room = {
                roomId: roomObject.roomId,
                members: [],
            }
            rooms.push(room);
        }

        res.json(rooms);

    });

    /**
     * Creates a room and returns the room_id if request is valid.
     * In case of a problem (..eg, an existing room already has the name in the request), 
     * the API will return  JSON object with an error.
     */
    router.post('/create', async (req, res): Promise<void> => {
        // Validate request body 
        const result = CreateRoomRequestBodySchema.safeParse(req.body);
        if (!result.success) {
            res.status(400).json({eror: result.error});
            return;
        }
        
        const { roomName, isPrivate, isDm, invitedUsers} = req.body;
        const owner = req.user;
        
        if (isPrivate) {
            try {
                const res = await createPrivateRoom(roomName, isDm, owner?.id!);
            } catch(e) {
                res.status(500).json(e);
            }
        }

        
    })

    return router;
}

export function deleteRoom(roomId: string, io: Server, publicRooms: publicRoomsAvalible) {
    const room = publicRooms.get(roomId);
    if (!room) return;

    // 1. notify everyone in the room
    io.to(roomId).emit('room_deleted', roomId);

    // 2. remove all sockets from the room
    io.socketsLeave(roomId);

    // 3. clear the timer
    if (room.timeout) clearTimeout(room.timeout);

    // 4. clean up publicRooms map
    publicRooms.delete(roomId);
}