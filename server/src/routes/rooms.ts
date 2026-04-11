// Express router for room-related REST endpoints.
// Public rooms are tracked only in memory (publicRooms map) -- they are
// never written to the database.  Private rooms are persisted via Prisma.

import { Server } from 'socket.io';
import { Router } from 'express';
import type { PublicRoom } from '../../../packages/shared/lib/room.js'
import { CreateRoomRequestBodySchema } from '../../../packages/shared/lib/zodSchemas.js';
import { createPrivateRoom } from '../db/rooms.js';
import type { publicRoomsAvalible } from '../lib/roomsAvalible.js';

/**
 * Builds and returns the rooms router.
 *
 * @param io - The socket.io server object
 * @param publicRooms - Shared in-memory map of active public rooms
 * @returns An Express Router with room CRUD handlers
 */
export default function roomsRouter (
    io: Server,
    publicRooms: publicRoomsAvalible
) {

    const router = Router();

    /**
     * GET /api/rooms/fetch/public
     *
     * Returns all active public rooms with their connected users.
     * Filters out the per-socket rooms that Socket.io creates automatically.
     * Doesn't search database because public rooms aren't saved in the database.
     *
     * Success: 200 PublicRoom[]
     */
    router.get('/fetch/public', async (req, res): Promise<void> => {
        const rooms: PublicRoom[] = [];

        //! Destructuring [roomObject] treats each Map value as an array,
        //! but publicRooms.values() yields PublicRoom objects directly.
        //! This means roomObject is actually the first character of the
        //! iterable, not a PublicRoom.  Should be: for (const roomObject of publicRooms.values())
    
        for (const [roomObject] of publicRooms.values()) {
            const room = {
                roomId: roomObject.roomId,
                members: [],
            }
            rooms.push(room);
        }

        res.json(rooms);

    });

    /**
     * POST /api/rooms/create
     *
     * Creates a room and returns the room_id if request is valid.
     * In case of a problem (e.g., an existing room already has the name in the request),
     * the API will return a JSON object with an error.
     *
     * Body: { roomName: string, isPrivate: boolean, isDm: boolean, invitedUsers: User[] }
     * Success: varies (incomplete -- see TODO below)
     * Failure: 400 (validation) | 500 (database error)
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
                //! The result of createPrivateRoom is stored in const res which
                //! shadows the outer res (Express response object).  After this
                //! line, the Express res cannot be referenced inside this block.
                const res = await createPrivateRoom(roomName, isDm, owner?.id!);
            } catch(e) {
                res.status(500).json(e);
            }
        }


    })

    return router;
}

/**
 * Removes a public room from the server, notifies all members, and cleans up
 * any Socket.IO state and the inactivity timer.
 *
 * @param roomId - The ID of the public room to delete
 * @param io - The Socket.IO server instance, used to broadcast and evict sockets
 * @param publicRooms - The shared in-memory rooms map to remove the entry from
 */
export function deletePublicRoom(roomId: string, io: Server, publicRooms: publicRoomsAvalible) {
    const room = publicRooms.get(roomId);
    if (!room) return;

    // notify everyone in the room
    io.to(roomId).emit('room_deleted', roomId);

    // remove all sockets from the room
    io.socketsLeave(roomId);

    // clear the timer
    if (room.timeout) clearTimeout(room.timeout);

    // clean up publicRooms map
    publicRooms.delete(roomId);
}