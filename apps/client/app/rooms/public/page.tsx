'use client'
import { joinRoom } from "@odigo/shared/lib/socket";
import { useRouter } from "next/navigation";
import { PublicRoom } from "@odigo/shared/lib/room";
import { fetchPublicRooms } from "@odigo/shared/lib/handlers/rooms";
import { useEffect, useState } from "react";
import PublicRoomListObject from "@odigo/ui/components/PublicRoomListObject/PublicRoomListObject";
import { useSocket } from "@/lib/SessionContext";
import { Socket } from "socket.io-client";
import { getAccessToken } from "@/lib/supabase/client";

export default function BrowseRooms () {
    const socket: Socket = useSocket()!;
    const router = useRouter();
    const [publicRooms, setRooms] = useState<PublicRoom[]>();

    const OnJoin = async  (roomId: string) => {
        const { error } = await joinRoom(socket, roomId);
        if (error) {
            alert(error);
        } else {
            router.push(`/room/${roomId}/chat`);
        }
    };

    const onCreateRoom = () => {
        router.push('/rooms/create');
    }

    useEffect(() => {
        const fetchRooms = async () => {
            const token: string = await getAccessToken() ?? "";
            const { rooms, error } = await fetchPublicRooms(token);
            if (error) {
                alert(error);
            } else {
                setRooms(rooms!);
            }
        }

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
                        <PublicRoomListObject key={room.roomId} roomId={room.roomId} callback={OnJoin} />
                    ))}
                </ul>
            )}
        </div>
    );
}