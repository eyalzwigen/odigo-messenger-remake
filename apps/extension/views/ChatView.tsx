// Chat view for the extension side panel.
// Renders the shared PublicChat component for the room the background
// service worker has already joined.

import { joinRoom } from "@odigo/shared/lib/socket";
import PublicChat from "@odigo/ui/components/chat/PublicChat";
import { useState, useEffect, use } from "react";
import type { PublicMessage } from "@odigo/shared/lib/message";
import { Socket } from "socket.io-client";
import { useSocket } from "../lib/SessionContext";

/**
 * Displays a public room's chat inside the extension side panel.
 *
 * The background service worker handles joining the room.  This component
 * only needs to render the already-joined room with its message history.
 *
 * @param roomId - The ID of the room that has been accepted
 * @param messageHistory - Messages loaded from local storage by App.tsx
 */
export default function ChatPage({
  roomId,
  messageHistory,
}: {
  roomId: string;
  messageHistory: PublicMessage[];
}) {
  const socket: Socket = useSocket()!;

  /**
   * Called by PublicChat when the server emits 'room_deleted'.
   * Closes the side panel since there is no longer a room to show.
   */
  const onRoomDeleted = () => {
    //! window.close is missing parentheses -- the function is referenced
    //! but never called, so the side panel does not close when the room
    //! is deleted.  Should be: window.close()
    window.close;
  };

  return (
    <PublicChat
      roomId={roomId}
      pastMessages={messageHistory}
      onRoomDeleted={onRoomDeleted}
      socket={useSocket()!}
    />
  );
}
