import 'dotenv/config';
import prisma from './index.js';
import { Prisma } from '../generated/prisma/client.js';
import type { PrivateRoom } from '../../../packages/shared/lib/room.js';

/**
 *  An asynchronous database function that creates a private room. Used by API
 *
 * @param name - The room's name
 * @param is_dm - If the room is a DM room
 * @param owner_id - The uid of the user that sent the POST request to create the room.
 *
 * @returns The created Room object
 * @throws {PrismaClientKnownRequestError} if the request was invalid
 * @throws {Error} if an unexpected error occurred
 */
//* owner_id Got the uid through requireAuth(). See server\src\lib\supabase.ts
// TODO: figure out if DMs should use this function or dedicated ones
export async function createPrivateRoom(name: string, is_dm: boolean, owner_id: string, ): Promise<PrivateRoom> {

    // Insert a new row to the Room table
    const res = await prisma.room.create({
        data:{
            name,
            is_dm,
            owner_id
        },
        // To make sure you can access the row of the owner (Prisma knows the row based on the owner_id, look at server\prisma\schema.prisma)
        include: {
            owner: true
        }
    });

    // Retuns a room object, and the owner in users
    return {
        id: res.id!,
        name: res.name!,
        is_dm: res.is_dm!,
        members: [{
            // Create a user object
            id: res.owner_id!,
            username: res.owner?.username!
        }],
        created_at: res.created_at!
    }
}

export async function getPrivateRoom(roomId: string, userId: string): Promise<PrivateRoom> {
    const res = await prisma.room.findUnique({
        where: { id: roomId },
        include: {
            members: {
                include: {
                    user: true  // each UserRoom row -> its User
                }
            }
        }
    });
    if (!res) throw new Error("Room not found");

    for (const user of res.members) {
        if (user.user_id === userId) {
            return {
                id: res.id,
                name: res.name,
                is_dm: res.is_dm,
                members: res.members.map(m => ({ id: m.user.id, username: m.user.username })),
                created_at: res.created_at
            };
        }
    }
    //* The message is room not found instead of unauthorized just in case so a malicous guy couldnn't know.
    throw new Error('Room not found');
}

/* For group chats */
export async function leavePrivateRoom(roomId: string, userId: string): Promise<PrivateRoom | null> {
    const room: PrivateRoom = await getPrivateRoom(roomId, userId);
    if (room.is_dm) return null;

    await prisma.userRoom.delete({
        where: {
            user_id_room_id: { user_id: userId, room_id: roomId }
        }
    });

    return room;
}

/* For DM rooms */
export async function deletePrivateRoom(roomId: string, userId :string): Promise<PrivateRoom | null> {
    const room = await getPrivateRoom(roomId, userId);
    if (!room.is_dm) return null;

    const res = await prisma.room.delete({
        where: {
            id: roomId
        },
        include: {
            members: {
                include: {
                    user: true  // each UserRoom row -> its User
                }
            }
        }
    });

    return {
        id: res.id,
        name: res.name,
        is_dm: res.is_dm,
        members: res.members.map(m => ({ id: m.user.id, username: m.user.username })),
        created_at: res.created_at
    };
}