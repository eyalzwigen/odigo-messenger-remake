import type { User } from '../../../shared/lib/user.js';

export type ConnectedUsers = Map<string, Set<string>>; // userId → Set<socketId>
