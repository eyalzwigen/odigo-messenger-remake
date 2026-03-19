import { Server } from 'socket.io';
import { Router } from 'express';
import type { Room } from '../../../shared/lib/room.js'
import type { User } from '../../../shared/lib/user.js'
import type { ConnectedUsers } from "../lib/connectedUsers.js";
import * as z from 'zod';
import { CreateRoomRequestBodySchema } from '../lib/zodSchemas.js';
import { createPrivateRoom } from '../db/rooms.js';

export default function roomsRouter (
    io: Server,
    connectedUsers: ConnectedUsers
) {

    const router = Router()

    /**
     * Returns all active public rooms with their connected users.
     * Filters out the per-socket rooms that Socket.io creates automatically.
     * Doesn't search database becasue public rooms aren't saved in the database
     */ //! Depracated! Need to update to the new way of Supabase!
    router.get('/fetch/public', async (req, res): Promise<void> => {
        const rooms: Room[] = [];
        const raw_rooms = io.of('/').adapter.rooms;

        for (const [roomName, usersList] of raw_rooms) {
            if (connectedUsers.has(roomName)) continue; // skip socket-id rooms

            const users: User[] = [];
            for (const socketId of usersList) {
                users.push(
                    connectedUsers.get(socketId)!
                );
            }

            rooms.push({ room_name: roomName, users });
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

            }
        }

        
    })

    return router;
}