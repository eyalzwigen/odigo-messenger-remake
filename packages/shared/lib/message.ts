import type { PrivateRoom, PublicRoom } from "./room.js";
import type { User } from "./user.js";

/**
 * A message sent inside a persistent private room.
 * Private messages are stored in the database and have full metadata.
 */
export interface PrivateMessage {
  /** Database UUID for this message */
  id: string;
  /** The text content of the message */
  message: string;
  /** When the message was stored server-side */
  sentAt: Date;
  /** UUID of the user who sent the message */
  senderId: string;
  /** Populated sender object (joined server-side) */
  sender: User;
  /** UUID of the room this message belongs to */
  roomId: string;
  /** Optional room reference (populated when fetching with relations) */
  room?: PrivateRoom;
}

/**
 * A message sent inside a transient public room.
 * Public messages are held only in memory and are not persisted to the database.
 * They include just enough information to render a chat bubble.
 */
export interface PublicMessage {
  /** The text content of the message */
  message: string;
  /** Display name of the sender at the time the message was sent */
  senderName: string;
  /** ID of the public room this message belongs to */
  roomId: string;
}
