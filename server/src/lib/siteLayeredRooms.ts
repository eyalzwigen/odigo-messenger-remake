import type { User } from "../../../packages/shared/lib/user.js"

/**
 * Describes a single active-link entry before it was simplified to use
 * a plain Set of socket IDs.  No longer used at runtime but kept for
 * reference.
 */
export interface SocketsActiveLinks {
    url: string,
    activeUsers: User[]
}

/**
 * Tracks which sockets are currently viewing a given URL (or hostname).
 *
 * Key   - URL string or hostname (depending on the fullSite flag in the
 *         active_link socket event)
 * Value - Set of socket IDs currently on that URL
 *
 * When at least two sockets are in the same Set, the server creates a
 * temporary public room and joins all of them to it.
 */
export type SocketActiveLinks = Map<string, Set<string>>;
