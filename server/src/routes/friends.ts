import type { Server } from "socket.io";
import type { ConnectedUsers } from "../lib/connectedUsers.js";
import { Router } from "express";
import { FriendRequestValidator, type FriendRequestInput } from '../../../packages/shared/lib/friends.js'
import { acceptFriendRequest, createFriendRequest } from "../db/friends.js";

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

        //TODO: Check if the request sender has the same sender_id as in the request
        //TODO: Check if the user wants to be friends with themselves
        //TODO: Check if the users are already friends
        //TODO: Check if one of the users already sent a request

        
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

    router.get('/request/accept', async (req, res) => {
        if (!req.body.id) {
            res.status(400).json({error: 'No request id given.'});
            return;
        }

       //TODO: Check if the user is thee reciver of the request
        
       try {
            acceptFriendRequest(req.body.id)
            res.status(201).json({error: null})
       } catch (e) {

       }
    })
}