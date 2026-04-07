import type { PrivateRoom } from "./room";
import type { User } from "./user"
import { z } from 'zod'

export interface FriendRequest {
    id: string,
    createdAt: Date,

    senderId: string,
    sender?: User,       // populated server-side, not validated

    receiverId: string,
    receiver?: User      // populated server-side, not validated
}

// Validates raw incoming data only — sender/receiver are joined server-side
export const FriendRequestValidator = z.object({
    id:  z.string(),
    created_at:  z.date(),
    sender_id:   z.string(),
    receiver_id: z.string(),
});

export type FriendRequestInput = z.infer<typeof FriendRequestValidator>;

export interface Friendship {
    id: string,
    created_at: Date,

    user_a_id: string,
    user_a?: User,

    user_b_id: string,
    user_b?: User,

    dm_room_id?: string | null //* Creates a room only on the first message sent
    dm_room?: PrivateRoom
};

export const FriendshipValidator = z.object({
    id: z.string(),
    created_at: z.date(),

    user_a_id: z.string(),
    user_b_id: z.string(),

    dm_room_id: z.string().optional().nullable() //* Creates a room only on the first message sent
});