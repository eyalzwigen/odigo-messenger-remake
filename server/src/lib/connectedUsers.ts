import type { User } from '../../../shared/lib/user.js';

/**
 * Tracks every socket that belongs to a given user.
 *
 * Key   - userId (Supabase UUID)
 * Value - Set of socket IDs currently open for that user
 *
 * One user can have multiple sockets at the same time (e.g. different tabs).
 * When the Set becomes empty, the userId key is deleted from the Map.
 */
export type ConnectedUsers = Map<string, Set<string>>; // userId -> Set<socketId>
