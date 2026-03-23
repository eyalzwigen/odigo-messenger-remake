import 'dotenv/config';
import prisma from './index.js';
import type { User } from '../../../shared/lib/user.js';
import type { PrivateRoom } from '../../../shared/lib/room.js';
import { Prisma } from '../generated/prisma/client.js';

/**
 *  An asynchronous database function that creates a private room. Used by API
 * 
 * @param name - The room's name
 * @param is_dm - If the room is a DM room
 * @param owner_id - The uid of the user that sent the POST requet to create the room. 
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
        roomId: res.id!,
        roomName: res.name!,
        isDm: res.is_dm!,
        members: [{
            // Create a user object
            id: res.owner_id!,
            username: res.owner?.username!
        }],
        createdAt: res.created_at!
    }
}