import type { Server } from "socket.io";
import type { ConnectedUsers } from "../lib/connectedUsers.js";
import { Router } from "express";
import { FriendRequestValidator, type FriendRequestInput } from '../../../packages/shared/lib/FriendRequest.js'
import { createFriendRequest } from "../db/friends.js";

export default function friendsRouter (
    io: Server,
    connectedUsers: ConnectedUsers,
) {

    const router = Router();
    

    router.get('', async (req, res): Promise<void> => {
        //TODO: fetch user's friends
    });

    router.post('/request', async (req, res): Promise<void> => {
        const result = FriendRequestValidator.safeParse(req.body);
        if (!result.success) {
            res.status(400).json({ error: result.error });
            return;
        }

        const friendRequest: FriendRequestInput = req.body;
        
        try {
            const request = await createFriendRequest(friendRequest);
            const reciverSockets = connectedUsers.get(friendRequest.receiver_id);
            if (reciverSockets) {
                for (const socket of reciverSockets) io.to(socket).emit('friend_request_received', request);
            }
        } catch (e) {
            res.status(500).json(e);
        }
    });
}