import type { PrivateRoom, PublicRoom } from "./room.js"
import type { User } from "./user.js"

export interface PrivateMessage {
    id: string,
    message: string,
    sentAt: Date,
    senderId: string,
    sender: User,
    roomId: string,
    room?: PrivateRoom
}

export interface PublicMessage {
    message: string,
    sentAt: Date,
    sender: User,
    room: PublicRoom
}