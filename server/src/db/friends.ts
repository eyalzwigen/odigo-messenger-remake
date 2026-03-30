import type { FriendRequestInput } from "../../../packages/shared/lib/FriendRequest.js";
import prisma from "./index.js";

export async function createFriendRequest(data: FriendRequestInput) {
    
    return await prisma.friendRequest.create({ data });
}