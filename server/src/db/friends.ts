import type { FriendRequestInput, Friendship } from "../../../packages/shared/lib/friends.js";
import prisma from "./index.js";

export async function createFriendRequest(data: FriendRequestInput) {
    return await prisma.friendRequest.create({ data });
}

export async function acceptFriendRequest(requestId) Promise<Friendship>{
    //TODO: Create Friendship
    //TODO: Delete Friend Request From ID
}

export async function getFriendship(user_a_id: string, user_b_id: string): Promise<Friendship | null> {
    const res = await prisma.friendship.findUnique({
        where: {
            user_a_id_user_b_id: {
                user_a_id: user_a_id,
                user_b_id: user_b_id
            }
        }
    })

    if (!res) return null;

    const friendship: Friendship = {
        id: res.id,
        created_at: res.created_at,

        user_a_id: res.user_a_id,

        user_b_id: res.user_b_id,
    }

    return friendship;
}

export async function getFriendRequestBySenderAndReciver(sender_id: string, receiver_id: string): Promise<FriendRequestInput | null> {
    const res = await prisma.friendRequest.findUnique({
        where: {
            sender_id_receiver_id: {
                sender_id: sender_id,
                receiver_id: receiver_id
            }
        }
    })

    if (!res) return null;

    const friendRequest: FriendRequestInput = {
        id: res.id,
        created_at: res.created_at,
        sender_id: res.sender_id,
        receiver_id: res.receiver_id
    }

    return friendRequest;
}

export async function getFriendRequestById(request_id: string): Promise<FriendRequestInput | null> {
    const res = await prisma.friendRequest.findUnique({
        where: {
            id: request_id
        }
    })

    if (!res) return null;

    const friendRequest: FriendRequestInput = {
        id: res.id,
        created_at: res.created_at,
        sender_id: res.sender_id,
        receiver_id: res.receiver_id
    }

    return friendRequest;
}