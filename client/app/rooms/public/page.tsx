'use client'
import { joinRoom } from "@/lib/socket";
import { useRouter } from "next/navigation";
import { PublicRoom } from "../../../../shared/lib/room";
import { fetchPublicRooms } from "@/lib/handlers/rooms";
import { useEffect, useState } from "react";
import PublicRoomListObject from "@/components/PublicRoomListObject/PublicRoomListObject";
import { useSocket } from "@/lib/SessionContext";
import { Socket } from "socket.io-client";

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
            const { rooms, error } = await fetchPublicRooms();
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