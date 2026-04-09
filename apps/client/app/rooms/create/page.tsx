'use client'

// Page for creating a new named public room from the web client.

import CreatePublicRoomForm from "@odigo/ui/components/forms/CreateRoom";
import { useSocket } from "@/lib/SessionContext";
import { createPublicRoom } from "@odigo/shared/lib/socket";
import { useRouter } from "next/navigation";
import { Socket } from "socket.io-client";

/**
 * The /rooms/create page.
 * Renders the CreatePublicRoomForm and, on submission, emits a
 * create_public_room event over the socket.  Navigates to the new room's
 * chat page on success, or shows an alert on error.
 */
export default function CreateRoom() {
    const router = useRouter();
    const socket: Socket = useSocket()!;

    /**
     * Handles form submission from CreatePublicRoomForm.
     * Reads the room_name field, asks the server to create the room, and
     * navigates into it if successful.
     *
     * @param formData - FormData from the create-room HTML form
     */
    const OnCreateRoom = async  (formData: FormData) => {
        const roomId = formData.get('room_name') as string
        const { error } = await createPublicRoom(socket, roomId);
        if (error) {
            alert(error);
            return;
        }
        router.push(`/room/${roomId}/chat`);
    };
    return (
        <CreatePublicRoomForm callback={OnCreateRoom}></CreatePublicRoomForm>
    );
}
