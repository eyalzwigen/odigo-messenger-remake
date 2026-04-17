import type { PrivateRoom } from "./room";
import type { User } from "./user";
import { z } from "zod";

/**
 * A friend request sent from one user to another.
 * sender and receiver are optional because they are joined on the server --
 * the client only sends / receives the ID fields.
 */
export interface FriendRequest {
  id: string;
  createdAt: Date;

  senderId: string;
  sender?: User; // populated server-side, not validated

  receiverId: string;
  receiver?: User; // populated server-side, not validated
}

/**
 * Zod schema for validating raw incoming friend request data.
 * Uses snake_case field names to match the database column names.
 *
 * Note: sender/receiver User objects are never in the incoming payload --
 * they are joined server-side after validation.
 */
// Validates raw incoming data only -- sender/receiver are joined server-side
export const FriendRequestValidator = z.object({
  id: z.string(),
  created_at: z.date(),
  sender_id: z.string(),
  receiver_id: z.string(),
});

/** The validated shape of a friend request as it comes from the client. */
export type FriendRequestInput = z.infer<typeof FriendRequestValidator>;

/**
 * A confirmed friendship between two users.
 *
 * user_a and user_b are optional join fields populated only when the query
 * includes relations.  dm_room_id is null until the first message is sent --
 * the DM room is created lazily on demand.
 */
export interface Friendship {
  id: string;
  created_at: Date;

  user_a_id: string;
  user_a?: User;

  user_b_id: string;
  user_b?: User;

  dm_room_id?: string | null; //* Creates a room only on the first message sent
  dm_room?: PrivateRoom;
}

/**
 * Zod schema for validating a Friendship object (e.g. when received via API).
 */
export const FriendshipValidator = z.object({
  id: z.string(),
  created_at: z.date(),

  user_a_id: z.string(),
  user_b_id: z.string(),

  dm_room_id: z.string().optional().nullable(), //* Creates a room only on the first message sent
});
