import type { User } from './user.js'

export interface Room {
    name: string,
    users: User[]
};