import type { PrivateMessage } from './message.js'
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
    roomName: string,
    members: User[]
}