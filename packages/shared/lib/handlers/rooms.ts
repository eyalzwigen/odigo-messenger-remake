import type { PublicRoom } from '../../../shared/lib/room'
import { getAuthHeaders } from './supabase';
import { getHost } from './host';

export async function fetchPublicRooms(token: string): Promise<
    { rooms: PublicRoom[], error: null } |
    { rooms: null, error: string }
> {
    try {
        const authHeaders = await getAuthHeaders(token);

        const res = await fetch(`${getHost()}/api/rooms/fetch/public`, {
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