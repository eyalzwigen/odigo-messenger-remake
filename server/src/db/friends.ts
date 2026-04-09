// Database helpers for the friends system.
// All functions talk to Prisma and return plain objects (not Prisma model
// instances) so callers don't depend on generated Prisma types.

import type { FriendRequestInput, Friendship } from "../../../packages/shared/lib/friends.js";
import prisma from "./index.js";

/**
 * Inserts a new friend request row into the database.
 *
 * @param data - The validated friend request payload (sender_id, receiver_id, etc.)
 * @returns The newly created Prisma FriendRequest record
 */
export async function createFriendRequest(data: FriendRequestInput) {
    return await prisma.friendRequest.create({ data });
}

/**
 * Accepts a pending friend request by creating a Friendship row and then
 * deleting the original FriendRequest row in the same logical transaction.
 *
 * @param friendRequest - The friend request to accept (must include a valid id)
 * @returns The new Friendship object, or null if the operation failed
 */
export async function acceptFriendRequest(friendRequest: FriendRequestInput): Promise<Friendship | null> {
    try {
        const friendship = await prisma.friendship.create({
            data: {
                user_a_id: friendRequest.sender_id,
                user_b_id: friendRequest.receiver_id
            },
            include: {
                user_a: true,
                user_b: true
            }
        });

        // Remove the request now that it has been fulfilled
        await prisma.friendRequest.delete({
            where: {
                id: friendRequest.id
            }
        });

        return friendship;
    } catch (e) {
        console.error("acceptFriendRequest failed:", e);
        return null;
    }
}

/**
 * Looks up a Friendship row between two users, regardless of which user is
 * stored as user_a and which is user_b.
 *
 * @param user_a_id - ID of the first user
 * @param user_b_id - ID of the second user
 * @returns The Friendship if one exists, otherwise null
 */
export async function getFriendship(user_a_id: string, user_b_id: string): Promise<Friendship | null> {
    const res = await prisma.friendship.findFirst({
        where: {
            OR: [
                { user_a_id, user_b_id },
                { user_a_id: user_b_id, user_b_id: user_a_id }
            ]
        }
    });

    if (!res) return null;

    return {
        id: res.id,
        created_at: res.created_at,
        user_a_id: res.user_a_id,
        user_b_id: res.user_b_id,
    };
}

/**
 * Returns all Friendship rows that involve the given user (as either party).
 *
 * @param user_id - The ID of the user whose friendships to fetch
 * @returns An array of Friendship objects, or null if none exist
 */
export async function fetchFriendships(user_id: string): Promise<Friendship[] | null> {
    const res = await prisma.friendship.findMany({
        where: {
            OR: [
                { user_a_id: user_id },
                { user_b_id: user_id }
            ]
        }
    });

    return res;
}

/**
 * Checks whether a friend request already exists between two users,
 * regardless of who sent it.
 *
 * @param sender_id - ID of one user
 * @param receiver_id - ID of the other user
 * @returns The FriendRequestInput if a request exists, otherwise null
 */
export async function getFriendRequestBySenderAndReceiver(sender_id: string, receiver_id: string): Promise<FriendRequestInput | null> {
    const res = await prisma.friendRequest.findFirst({
        where: {
            OR: [
                { sender_id, receiver_id },
                { sender_id: receiver_id, receiver_id: sender_id }
            ]
        }
    });

    if (!res) return null;

    return {
        id: res.id,
        created_at: res.created_at,
        sender_id: res.sender_id,
        receiver_id: res.receiver_id
    };
}

/**
 * Fetches a single friend request by its primary key.
 *
 * @param request_id - The UUID of the FriendRequest row
 * @returns The FriendRequestInput if found, otherwise null
 */
export async function getFriendRequestById(request_id: string): Promise<FriendRequestInput | null> {
    const res = await prisma.friendRequest.findUnique({
        where: {
            id: request_id
        }
    });

    if (!res) return null;

    return {
        id: res.id,
        created_at: res.created_at,
        sender_id: res.sender_id,
        receiver_id: res.receiver_id
    };
}
