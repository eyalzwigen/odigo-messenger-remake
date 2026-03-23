import type { PublicRoom } from '../../../shared/lib/room'
import { getAuthHeaders } from '../supabase/client';

const host = process.env.NEXT_PUBLIC_EXPRESS_SERVER_HOST ?? "http://localhost:8080";

export async function fetchPublicRooms(): Promise<
    { rooms: PublicRoom[], error: null } |
    { rooms: null, error: string }
> {
    try {
        const authHeaders = await getAuthHeaders();

        const res = await fetch(`${host}/api/rooms/fetch/public`, {
            headers: authHeaders
        });

        if (!res.ok) return { rooms: null, error: 'Error fetching rooms' };

        const rooms: PublicRoom[] = await res.json();
        return { rooms, error: null };

    } catch (e) {
        // catches "Not authenticated" error from getAuthHeaders
        // and any network errors
        return { rooms: null, error: e instanceof Error ? e.message : 'Unknown error' };
    }
}