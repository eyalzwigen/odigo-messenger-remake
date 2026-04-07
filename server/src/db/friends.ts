import type { FriendRequestInput } from "../../../packages/shared/lib/friends.js";
import prisma from "./index.js";

export async function createFriendRequest(data: FriendRequestInput) {
    
    return await prisma.friendRequest.create({ data });
}

export async function acceptFriendRequest(requestId) {
    const friendship = {
        id: string,
        create
    }
}