import type { PrivateMessage, PublicMessage } from './message.js'
import type { User } from './user.js'

/**
 * A persistent room stored in the database.
 * Used for group chats and DMs that survive server restarts.
 *
 * When isDm is true, roomName is null and the room is identified
 * only by its participants.
 */
export interface PrivateRoom {
    /** Database UUID for this room */
    roomId: string,
    /** Display name, or null for DM rooms */
    roomName: string | null,  // null for DM rooms
    /** True when this room is a direct message between two users */
    isDm: boolean,
    /** Users who are members of this room */
    members: User[],
    /** Message history (not always populated -- depends on the query) */
    messages?: PrivateMessage[],
    /** When the room was created */
    createdAt: Date
}

/**
 * A transient room that exists only in server memory.
 * Public rooms are created on demand when users share a URL or
 * explicitly create one, and are deleted after 10 minutes of inactivity.
 *
 * The timeout field holds the Node.js timer handle for the auto-delete
 * logic.  It is typed as any to avoid importing NodeJS types everywhere.
 */
export interface PublicRoom {
    /** The room's identifier -- usually the URL or a user-chosen name */
    roomId: string,
    /** Users currently in the room */
    members: User[],
    /** In-memory message history (capped at MAX_MESSAGES_SAVED) */
    messages?: PublicMessage[],
    /** Handle returned by setTimeout for the inactivity cleanup timer */
    timeout?: any
}
