// Client-side Socket.IO utilities shared between the web client and the
// browser extension.  Maintains a single socket instance per context so
// multiple components can share the same connection.

import { io, Socket } from "socket.io-client";
import type { PublicMessage } from "./message.js";
import { getHost } from "./handlers/host";

const host = getHost();

// Module-level singleton -- only one socket is created per JS context
let socket: Socket | null = null;

/** The payload emitted with the 'message' socket event */
export type MessageData = {
  roomId: string;
  message: string;
};

/**
 * Creates a new Socket.IO connection authenticated with the given access token.
 * If a socket already exists, calls onConnected immediately and returns the
 * existing socket without creating a duplicate connection.
 *
 * @param accessToken - Supabase JWT sent in socket.handshake.auth
 * @param onConnected - Callback fired once the socket successfully connects
 * @returns The (possibly pre-existing) socket instance
 */
export function connectUser(accessToken: string, onConnected: () => void) {
  if (socket) {
    onConnected();
    return socket;
  }
  socket = io(getHost(), {
    auth: {
      accessToken: accessToken,
    },
    transports: ["websocket"], // skip polling, go straight to websocket
  });

  socket.on("connect", () => {
    onConnected();
  });

  socket.on("connect_error", (error) => {
    console.error(error);
    socket = null;
  });

  socket.on("disconnect", () => {
    isJoining = false;
    currentRoom = null;
  });

  return socket;
}

/**
 * Returns the active socket, throwing if none has been created yet.
 * Use this inside components that require an established connection.
 *
 * @throws {Error} If connectUser has not been called first
 */
export function getSocket() {
  if (!socket) throw new Error("No socket created!");
  return socket;
}

/**
 * Updates the access token stored in socket.auth.
 * Called after a Supabase token refresh so the server gets the new token
 * on the next reconnection attempt without a full disconnect cycle.
 *
 * @param newToken - The refreshed Supabase JWT
 */
export function updateToken(newToken: string) {
  if (!socket) return;
  socket.auth = { accessToken: newToken };
  // no need to reconnect -- auth is sent on next connection attempt
}

/**
 * Disconnects and nulls out the singleton socket.
 * Call this on sign-out so a fresh socket is created on the next login.
 */
export function disconnectUser() {
  if (socket) socket.disconnect();
}

/**
 * Emits a 'message' event to the server for the specified room.
 *
 * @param socket - The active Socket.IO socket
 * @param data - Object containing roomId and the message text
 */
export function sendMessage(
  socket: Socket,
  { roomId, message }: MessageData,
): void {
  socket.emit("message", { roomId: roomId, message: message });
}

/** Tracks which room this socket is currently joined to */
let currentRoom: string | null = null;

/**
 * Asks the server to create a new named public room.
 * Wraps the socket emit / event pair in a Promise so callers can await the result.
 * Resolves after 5 seconds with an error if the server does not respond.
 *
 * @param socket - The active Socket.IO socket
 * @param roomId - The desired room name / ID
 * @returns On success: { createdRoomId, error: null }
 *          On failure: { createdRoomId: null, error: string }
 */
export async function createPublicRoom(
  socket: Socket,
  roomId: string,
): Promise<
  | { createdRoomId: string; error: null }
  | { createdRoomId: null; error: string }
> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      socket.off("public_room_created");
      socket.off("public_room_creation_error");
      resolve({ createdRoomId: null, error: "Request timed out" });
    }, 5000); // 5 seconds

    socket.emit("create_public_room", roomId);

    socket.once("public_room_created", (createdRoomId: string) => {
      clearTimeout(timeout);
      currentRoom = createdRoomId;
      resolve({ createdRoomId: createdRoomId, error: null });
    });

    socket.once("public_room_creation_error", (error: string) => {
      clearTimeout(timeout);
      resolve({ createdRoomId: null, error });
    });
  });
}

/**
 * Guards against concurrent join attempts from the same socket context.
 * Set to true while a join is in flight and reset to false on completion or error.
 */
let isJoining = false;

/**
 * Joins an existing public room and returns the message history.
 *
 * If the socket is already in the target room, returns immediately with an
 * empty history to avoid duplicating messages.
 *
 * A lock (isJoining) prevents a second join attempt while one is already in
 * progress, since emitting join_room twice before the server responds could
 * result in duplicate joined_room callbacks.
 *
 * Any messages that arrive between the join_room emit and the joined_room
 * acknowledgment are buffered and prepended to the history so they are not lost.
 *
 * Resolves after 5 seconds with an error if the server does not respond.
 *
 * @param socket - The active Socket.IO socket
 * @param roomId - The ID of the room to join
 * @returns On success: { joinedRoomId, messageHistory, error: null }
 *          On failure: { joinedRoomId: null, messageHistory: null, error: string }
 */
export async function joinRoom(
  socket: Socket,
  roomId: string,
): Promise<
  | { joinedRoomId: string; messageHistory: PublicMessage[]; error: null }
  | { joinedRoomId: null; messageHistory: null; error: string }
> {
  // already in this room
  if (currentRoom === roomId)
    return { joinedRoomId: roomId, messageHistory: [], error: null };

  // already joining, don't send another request
  if (isJoining)
    return {
      joinedRoomId: null,
      messageHistory: null,
      error: "Already joining a room",
    };

  isJoining = true; // lock

  return new Promise((resolve) => {
    const pendingMessages: PublicMessage[] = [];

    // Buffer any messages that arrive before the join is confirmed
    socket.on("message", (senderName: string, message: string) => {
      pendingMessages.push({ senderName, message, roomId });
    });

    const timeout = setTimeout(() => {
      isJoining = false; // unlock on timeout
      socket.off("joined_room");
      socket.off("join_error");
      socket.off("message");
      resolve({
        joinedRoomId: null,
        messageHistory: null,
        error: "Request timed out",
      });
    }, 5000);

    socket.emit("join_room", roomId);

    socket.once("joined_room", ({ joinedRoomId, messageHistory }) => {
      clearTimeout(timeout);
      socket.off("message");
      isJoining = false; // unlock on success
      currentRoom = joinedRoomId;
      // Merge server history with any messages that arrived mid-join
      const fullHistory = [...(messageHistory ?? []), ...pendingMessages];
      resolve({ joinedRoomId, messageHistory: fullHistory, error: null });
    });

    socket.once("join_error", (error: string) => {
      clearTimeout(timeout);
      socket.off("message");
      isJoining = false; // unlock on error
      resolve({ joinedRoomId: null, messageHistory: null, error });
    });
  });
}
