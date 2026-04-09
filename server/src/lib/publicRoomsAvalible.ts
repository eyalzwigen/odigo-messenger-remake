import type { PublicRoom } from "../../../packages/shared/lib/room.js";

/**
 * Tracks all currently active public rooms in memory.
 *
 * Key   - roomId (the room name / URL string)
 * Value - The full PublicRoom object including members, messages, and
 *         a cleanup timeout handle
 *
 * Public rooms are never persisted to the database.  They are created on the
 * fly and deleted after 10 minutes of inactivity via the timeout stored in
 * each PublicRoom.
 */
export type publicRoomsAvalible = Map<string, PublicRoom>;
