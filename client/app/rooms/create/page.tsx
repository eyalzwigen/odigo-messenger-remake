'use client'
import CreatePublicRoomForm from "@/components/forms/CreateRoom";
import { useSocket } from "@/lib/SessionContext";
import { createPublicRoom } from "@/lib/socket";
import { useRouter } from "next/navigation";
import { Socket } from "socket.io-client";

export default function CreateRoom() {
    const router = useRouter();
    const socket: Socket = useSocket()!;

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