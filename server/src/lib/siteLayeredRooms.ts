import type { User } from "../../../packages/shared/lib/user.js"

export interface SocketsActiveLinks {
    url: string,
    activeUsers: User[]
}

export type SocketActiveLinks = Map<string, Set<string>>;