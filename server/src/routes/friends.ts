// Express router for the friends / social system endpoints.
// All routes require the requireAuth middleware to be applied upstream
// (see server/src/index.ts).  The authenticated user is available as req.user.

import type { Server } from "socket.io";
import type { ConnectedUsers } from "../lib/connectedUsers.js";
import { Router } from "express";
import { FriendRequestValidator, type FriendRequestInput, type Friendship} from '../../../packages/shared/lib/friends.js'
import { acceptFriendRequest, createFriendRequest, fetchFriendships, getFriendRequestById, getFriendRequestBySenderAndReceiver, getFriendship } from "../db/friends.js";

/**
 * Builds and returns the friends router.
 *
 * @param io - The Socket.IO server, used to push real-time notifications
 *             to the receiver when a friend request is sent
 * @param connectedUsers - Shared map of userId to their active socket IDs,
 *                         used to look up the receiver's sockets
 * @returns An Express Router with friendship CRUD handlers
 */
export default function friendsRouter (
    io: Server,
    connectedUsers: ConnectedUsers,
) {

    const router = Router();


    /**
     * GET /api/friends
     *
     * Returns all friendships the authenticated user is part of.
     *
     * Success: 200 { friendships: Friendship[] }
     * Failure: 500 on unexpected error
     */
    router.get('', async (req, res): Promise<void> => {
        try {
            // fetch user's friends
            const friendships: Friendship[] | null = await fetchFriendships(req.user?.id!);

            res.status(200).json({friendships});
        } catch (e) { //* In case of an unexpected error.
            res.status(500).json(e);
        }
    });

    /**
     * POST /api/friends/request
     *
     * Sends a friend request from the authenticated user to another user.
     * Several guard checks are performed to prevent duplicate or invalid requests.
     * If the receiver is currently connected, they receive a real-time
     * 'friend_request_received' socket event.
     *
     * Body: { sender_id: string, receiver_id: string, ... }
     * Success: 201 { message: "Friend request created" }
     * Failure: 400 (validation) | 401 (auth mismatch) | 403 (duplicate) |
     *          409 (already friends or self-request) | 500 (unexpected)
     */
    router.post('/request', async (req, res): Promise<void> => {
        const result = FriendRequestValidator.safeParse(req.body);
        if (!result.success) {
            res.status(400).json({ error: result.error });
            return;
        }

        const friendRequest: FriendRequestInput = result.data;
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
            const checkExistingFriendship = await getFriendship(friendRequest.sender_id, friendRequest.receiver_id);
            if (checkExistingFriendship) {
                res.status(409).json({error: "Cannot send a friend request to someone you're already friends with"});
                return;
            }

            // Check if one of the users already sent a request
            const checkExistingFriendRequest = await getFriendRequestBySenderAndReceiver(friendRequest.sender_id, friendRequest.receiver_id);
            if (checkExistingFriendRequest) {
                res.status(403).json({error: "Cannot send a friend request if there is already a pendig friend request to the same person"});
                return;
            }

            const request = await createFriendRequest(friendRequest);

            // Push a real-time notification to the receiver if they are online
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

    /**
     * POST /api/friends/request/accept
     *
     * Accepts a pending friend request.  Only the intended receiver can
     * accept the request.  On success, the FriendRequest row is deleted and
     * a Friendship row is created.
     *
     * Body: { id: string }  (the FriendRequest UUID)
     * Success: 201 { message: "Friend request accepted" }
     * Failure: 400 (no id) | 401 (wrong user) | 404 (not found) | 500
     */
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

            const friendship: Friendship | null = await acceptFriendRequest(friendRequest);
            if (!friendship) {
                res.status(500).json({error: "An unexpected error occured"});
                return;
            }

            res.status(201).json({ message: "Friend request accepted" });

       } catch (e) { //* In case of an unexpected error
            res.status(500).json(e);
       }
    });

    /**
     * POST /api/friends/unfriend
     *
     * Removes a friendship between two users.
     */
    router.delete('/:id', async (req, res) => {
        //! Unfriending deletes the chat also

        // Extract user id from request
        const friendId: string = req.params.id;
        if (!friendId) {
            res.status(400).json({error: "No friend id given"});
            return;
        }

        // Check if user has a friendship with the user extracted
        const checkFriendship: Friendship | null = await getFriendship(req.user?.id!, friendId);

        if (checkFriendship) {
            //TODO: Delete friendship-based chat room from DB. 
            //* the chat will be read only and only avalible via cache
            
            //TODO: Delete friendship

            //TODO: response of 200 with json response that indicates the unfriending
        } else {
            //TODO: Send a 409 error because you can't unfriend someone you're not friends with
        }
    });
}
