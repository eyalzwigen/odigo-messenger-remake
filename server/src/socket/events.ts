// Registers all Socket.IO event handlers on the server.
// This module owns the real-time layer: authentication, room management,
// messaging, active-link tracking, and disconnect cleanup.

import { Server } from "socket.io";
import type { ConnectedUsers } from "../lib/connectedUsers.ts";
import type { publicRoomsAvalible } from "../lib/roomsAvalible.js";
import supabase from "../lib/supabase.js";
import type { User } from "../../../packages/shared/lib/user.ts";
import type { PublicRoom } from "../../../packages/shared/lib/room.js";
import { deleteRoom } from "../routes/rooms.js";
import type { SocketActiveLinks } from "../lib/siteLayeredRooms.js";

/**
 * Attaches all Socket.IO middleware and event listeners to the given server.
 *
 * @param io - The Socket.IO server instance
 * @param connectedUsers - Shared map of userId to their active socket IDs
 * @param publicRooms - Shared map of roomId to PublicRoom state
 * @param socketActiveLinks - Shared map of URL to socket IDs currently on that URL
 */
export function registerSocketEvents(
  io: Server,
  connectedUsers: ConnectedUsers,
  publicRooms: publicRoomsAvalible,
  socketActiveLinks: SocketActiveLinks,
) {
  // --- Authentication middleware ---
  // Every socket connection must carry a valid Supabase access token in
  // socket.handshake.auth.accessToken.  Unauthenticated connections are
  // rejected before any events can be emitted.
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.accessToken;
    if (!token) return next(new Error("Unauthorized"));

    const { data, error } = await supabase.auth.getUser(token);
    if (error) return next(new Error("Unauthorized"));

    // Store user info on the socket so event handlers can read it
    // without re-fetching from Supabase on every event.
    socket.data.userId = data.user.id;
    socket.data.username = data.user.user_metadata.username;
    next();
  });

  // When Socket.IO removes an internal room (e.g. when the last socket
  // leaves), also remove it from our publicRooms map if it exists there.
  io.of("/").adapter.on("delete-room", (room) => {
    publicRooms.delete(room);
  });

  // --- Per-connection event handlers ---
  io.on("connection", (socket) => {
    // Reconstruct a User object from the data attached by the middleware above
    const user: User = {
      accessToken: socket.handshake.auth.accessToken,
      id: socket.data.userId,
      username: socket.data.username,
    };

    // Register this socket under the user's entry in connectedUsers.
    // One user can have multiple sockets open (e.g. multiple tabs).
    if (!connectedUsers.has(user.id)) {
      connectedUsers.set(user.id, new Set());
    }
    console.log(publicRooms);

    // Leave any Socket.IO rooms that were auto-assigned on connection
    // so the socket starts in a clean state.
    for (const room of socket.rooms) {
      if (!(room === socket.id)) socket.leave(room);
    }

    connectedUsers.get(user.id)!.add(socket.id);

    // --- join_room ---
    // Client requests to join an existing public room by ID.
    // Responds with 'joined_room' (including message history) on success,
    // or 'join_error' on failure.
    socket.on("join_room", (roomId: string) => {
      console.log("join_room received:", roomId);
      console.log("room messages:", publicRooms.get(roomId)?.messages);

      if (!roomId) {
        socket.emit("join_error", "No room id given");
        return;
      }

      if (!publicRooms.has(roomId)) {
        socket.emit("join_error", "Room does not exist");
        return;
      }

      for (const room of socket.rooms) {
        if (room === roomId) {
          // Already in this room, send back an empty history to
          // avoid duplicating messages the client already has.
          socket.emit("joined_room", { roomId: roomId, messageHistory: [] });
          continue;
        }
        for (const room of socket.rooms) {
          if (!(room === socket.id)) socket.leave(room);
        }
      }

      socket.join(roomId);

      // Track the new member in the room's member list
      publicRooms.get(roomId)?.members.push({
        id: socket.data.userId,
        username: socket.data.username,
      });
      console.log({
        roomId: roomId,
        messageHistory: publicRooms.get(roomId)?.messages,
      });
      socket.emit("joined_room", {
        roomId: roomId,
        messageHistory: publicRooms.get(roomId)?.messages,
      });
    });

    // --- leave_room ---
    // Client explicitly leaves all rooms (used when navigating away).
    socket.on("leave_room", () => {
      for (const room of socket.rooms) {
        if (!(room === socket.id)) socket.leave(room);
      }
    });

    // --- active_link ---
    // Sent by the browser extension when the user navigates to a new URL.
    // If at least two sockets are on the same URL, a temporary room is
    // created for them and all matching sockets are joined to it.
    socket.on("active_link", async (url: string, fullSite: boolean) => {
      console.log("raw url:", url);

      // Optionally collapse the URL down to just the hostname so that
      // all pages on the same site share one room.
      const link = fullSite ? new URL(url).hostname : url;
      console.log("computed link:", link);

      // Register this socket as currently viewing the link
      if (!socketActiveLinks.has(link)) {
        socketActiveLinks.set(link, new Set());
      }
      socketActiveLinks.get(link)!.add(socket.id);
      console.log("size after add:", socketActiveLinks.get(link)?.size);
      console.log("socket.id:", socket.id);

      // Leave any room the socket is currently in before joining a new one
      for (const room of socket.rooms) {
        if (room !== socket.id) socket.leave(room);
      }

      const activeSocketIds = socketActiveLinks.get(link)!;
      const validSocketIds = new Set<string>();

      // Prune stale socket IDs — sockets that have disconnected since
      // they were added to this set.
      for (const socketId of activeSocketIds) {
        const sockets = await io.in(socketId).fetchSockets();
        if (sockets.length > 0) {
          validSocketIds.add(socketId);
        } else {
          activeSocketIds.delete(socketId);
        }
      }

      // Need at least 2 users on the same page to open a chat room
      if (validSocketIds.size < 2) return;

      // Create the room entry if this is the first time two people
      // ended up on this URL at the same time.
      // The room auto-deletes after 10 minutes of inactivity.
      if (!publicRooms.has(link)) {
        publicRooms.set(link, {
          roomId: link,
          members: [],
          messages: [],
          timeout: setTimeout(
            () => deleteRoom(link, io, publicRooms),
            10 * 60 * 1000,
          ),
        });
      }

      const room = publicRooms.get(link)!;
      const messageHistory = room.messages ?? [];

      // Join every valid socket to the room, adding them to the
      // member list only if they are not already tracked there.
      for (const socketId of validSocketIds) {
        const sockets = await io.in(socketId).fetchSockets();
        if (sockets.length === 0) continue;
        const s = sockets[0];

        if (!s?.rooms.has(link)) {
          s?.join(link);

          const alreadyMember = room.members.some(
            (m: { m: any }) => m.id === s?.data.userId,
          );
          if (!alreadyMember) {
            room.members.push({
              id: s?.data.userId,
              username: s?.data.username,
            });
          }

          // Notify the socket that it has been accepted into the room
          s?.emit("room_accepted", link, messageHistory);
        }
      }
    });

    // --- create_public_room ---
    // Client explicitly creates a named public room.
    // Responds with 'public_room_created' on success,
    // or 'public_room_creation_error' if the name is already taken or invalid.
    socket.on("create_public_room", (roomId: string) => {
      if (!roomId) {
        socket.emit("public_room_creation_error", "No room id given");
        return;
      }

      if (publicRooms.has(roomId)) {
        socket.emit("public_room_creation_error", "Name is already used");
        return;
      }

      // Leave all current rooms before creating and joining the new one
      for (const room of socket.rooms) {
        if (!(room === socket.id)) socket.leave(room);
      }
      socket.join(roomId);

      // Register the room in the shared map.
      // The room auto-deletes after 10 minutes of inactivity.
      publicRooms.set(roomId, {
        roomId: roomId,
        members: [
          {
            id: socket.data.userId,
            username: socket.data.username,
          },
        ],
        messages: [],
        timeout: setTimeout(
          () => deleteRoom(roomId, io, publicRooms),
          10 * 60 * 1000,
        ),
      });
      socket.emit("public_room_created", roomId);
    });

    // --- message ---
    // Client sends a chat message to a room.
    // The message is broadcast to all sockets in the room and appended
    // to the room's in-memory message history.
    // Responds with 'message_error' if the sender is not in the room.
    socket.on(
      "message",
      ({ roomId, message }: { roomId: string; message: string }) => {
        const room: PublicRoom | undefined = publicRooms.get(roomId);
        if (room == undefined || !socket.rooms.has(roomId)) {
          socket.emit(
            "message_error",
            `User is not connected to room: ${roomId}`,
          );
          return;
        }

        // If the history buffer is full, drop the oldest message (FIFO)
        if (
          room?.messages?.length ===
          parseInt(process.env.MAX_MESSAGES_SAVED ?? "50")
        ) {
          room.messages = room.messages?.slice(1);
        }

        room?.messages?.push({
          message: message,
          senderName: socket.data.username,
          roomId: roomId,
        });

        io.to(roomId).emit("message", user.username, message);
      },
    );

    // --- disconnect ---
    // Clean up all state associated with this socket when it disconnects.
    socket.on("disconnect", () => {
      const sockets = connectedUsers.get(user.id);
      if (sockets) {
        sockets.delete(socket.id);

        // If this was the user's last socket, remove them from
        // connectedUsers and from every public room's member list.
        if (sockets.size === 0) connectedUsers.delete(user.id);
        for (const [roomName, room] of publicRooms) {
          room.members = room.members.filter((m: User) => m.id !== user.id);
        }

        // Remove the socket from the active-link tracking map.
        // Clean up empty link entries to avoid memory leaks.
        for (const [link, socketIds] of socketActiveLinks) {
          socketIds.delete(socket.id);
          if (socketIds.size === 0) socketActiveLinks.delete(link);
        }
      }
    });
  });
}
