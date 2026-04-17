"use client";

// Public rooms browser page.
// Fetches the list of active public rooms from the API and renders
// a joinable list.  Also provides a button to create a new room.

import { joinRoom } from "@odigo/shared/lib/socket";
import { useRouter } from "next/navigation";
import { PublicRoom } from "@odigo/shared/lib/room";
import { fetchPublicRooms } from "@odigo/shared/lib/handlers/rooms";
import { useEffect, useState } from "react";
import PublicRoomListObject from "@odigo/ui/components/PublicRoomListObject/PublicRoomListObject";
import { useSocket } from "@/lib/SessionContext";
import { Socket } from "socket.io-client";
import { getAccessToken } from "@/lib/supabase/client";

/**
 * The /rooms/public page.
 * Displays all currently active public rooms and allows the user to join one
 * or navigate to the room creation page.
 */
export default function BrowseRooms() {
  const socket: Socket = useSocket()!;
  const router = useRouter();
  const [publicRooms, setRooms] = useState<PublicRoom[]>();

  /**
   * Joins the selected room over the socket and navigates to its chat page.
   *
   * @param roomId - The ID of the room to join
   */
  const OnJoin = async (roomId: string) => {
    const { error } = await joinRoom(socket, roomId);
    if (error) {
      alert(error);
    } else {
      router.push(`/room/${roomId}/chat`);
    }
  };

  /** Navigates to the room creation form */
  const onCreateRoom = () => {
    router.push("/rooms/create");
  };

  // Fetch the room list once on mount using the current user's access token
  useEffect(() => {
    const fetchRooms = async () => {
      const token: string = (await getAccessToken()) ?? "";
      const { rooms, error } = await fetchPublicRooms(token);
      if (error) {
        alert(error);
      } else {
        setRooms(rooms!);
      }
    };

    fetchRooms();
  }, []);

  return (
    <div>
      <button onClick={onCreateRoom}>Create Room</button>
      {!publicRooms ? (
        <p>Loading rooms...</p>
      ) : publicRooms.length === 0 ? (
        <p>No rooms yet. Create one!</p>
      ) : (
        <ul>
          {publicRooms.map((room) => (
            <PublicRoomListObject
              key={room.roomId}
              roomId={room.roomId}
              callback={OnJoin}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
