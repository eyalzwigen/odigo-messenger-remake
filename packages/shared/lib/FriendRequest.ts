import type { User } from "./user"
import { z } from 'zod'

export type RequestStatus = "PENDING" | "ACCEPTED" | "REJECTED"

export interface FriendRequest {
    id: string,
    createdAt: Date,
    status: RequestStatus,

    senderId: string,
    sender?: User,       // populated server-side, not validated

    receiverId: string,
    receiver?: User      // populated server-side, not validated
}

// Validates raw incoming data only — sender/receiver are joined server-side
export const FriendRequestValidator = z.object({
    id:  z.string(),
    created_at:  z.date(),
    status:     z.enum(["PENDING", "ACCEPTED", "REJECTED"]),
    sender_id:   z.string(),
    receiver_id: z.string(),
});

export type FriendRequestInput = z.infer<typeof FriendRequestValidator>;
