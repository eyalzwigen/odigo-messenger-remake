import type { PrivateMessage, PublicMessage } from './message.js'
import type { User } from './user.js'

export interface PrivateRoom {
    roomId: string,
    roomName: string | null,  // null for DM rooms
    isDm: boolean,
    members: User[],
    messages?: PrivateMessage[],
    createdAt: Date
}

export interface PublicRoom {
    roomId: string,
    members: User[],
    messages?: PublicMessage[],
    timeout?: any
}