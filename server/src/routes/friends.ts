import type { Server } from "socket.io";
import type { ConnectedUsers } from "../lib/connectedUsers.js";
import { Router } from "express";
import { FriendRequestValidator, type FriendRequestInput } from '../../../packages/shared/lib/friends.js'
import { acceptFriendRequest, createFriendRequest, getFriendRequestById, getFriendRequestBySenderAndReciver, getFriendship } from "../db/friends.js";

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
            // Check if the request sender has the same sender_id as in the request
            if (!(req.user?.id === friendRequest.sender_id)) {
                    res.status(401).json({error: "Cannot act on behalf of other users"});
                    return;
            }

            // Check if the user wants to be friends with themselves
            if (friendRequest.sender_id === friendRequest.receiver_id) {
                res.status(409).json({error: "Cannot send a friend request to yourself"});
                return;
            }

            // Check if the users are already friends
            const checkExistingFriendship = await getFriendRequestBySenderAndReciver(friendRequest.sender_id, friendRequest.receiver_id);
            if (checkExistingFriendship) {
                res.status(409).json({error: "Cannot send a friend request to someone you're already friends with"});
                return;
            }

            // Check if one of the users already sent a request
            const checkExistingFriendRequest = await getFriendRequestBySenderAndReciver(friendRequest.sender_id, friendRequest.receiver_id);
            if (checkExistingFriendRequest) {
                res.status(403).json({error: "Cannot send a friend request if there is already a pendig friend request to the same person"});
                return;
            }
            
            const request = await createFriendRequest(friendRequest);
            const reciverSockets = connectedUsers.get(friendRequest.receiver_id);
            if (reciverSockets) {
                for (const socket of reciverSockets) io.to(socket).emit('friend_request_received', request);
            }
            // Send response to sender and notify them that the request has been created
            res.status(201).json({message: "Friend request created"});
        } catch (e) { //* In case of an unexpected error. 
            res.status(500).json(e);
        }
    });

    router.post('/request/accept', async (req, res) => {
        if (!req.body.id) {
            res.status(400).json({error: 'No request id given.'});
            return;
        }

       try {
            // Check if request exists
            const friendRequest: FriendRequestInput | null = await getFriendRequestById(req.body.id);
            if (!friendRequest) {
                res.status(404).json({error: "Friend request does not exist"});
                return;
            }

            // Check if the request sender has the same reciver_id as in the request
            if (!(friendRequest.receiver_id === req.user?.id)) {
                res.status(401).json({error: "Cannot act on behalf of other users"});
                return;
            }

            acceptFriendRequest(req.body.id)
            
       } catch (e) { //* In case of an unexpected error
            res.status(500).json(e);
       }
    })
}